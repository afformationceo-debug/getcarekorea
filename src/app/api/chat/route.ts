import { streamText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Note: Removed edge runtime for Supabase server client compatibility

const SYSTEM_PROMPT = `You are an AI medical tourism consultant for GetCareKorea, a platform connecting international patients with Korean healthcare providers and medical interpreters.

Your role is to:
1. Help users find suitable hospitals, procedures, and interpreters in Korea
2. Provide accurate information about medical procedures, costs, and recovery times
3. Answer questions about medical tourism in Korea (visas, travel, accommodations)
4. Assist with inquiries and consultation requests
5. Be culturally sensitive and professional

Guidelines:
- Always be helpful, accurate, and empathetic
- If you don't have specific information, say so and offer to connect them with a consultant
- For medical advice, always recommend consulting with a licensed physician
- Provide cost estimates in ranges and note that actual prices may vary
- Highlight the benefits of Korean medical services (quality, technology, affordability)
- When users show interest, guide them toward making an inquiry

CRITICAL - Internal Link Recommendations:
When providing information about hospitals, procedures, or interpreters, ALWAYS include specific internal links in your response using this EXACT format:
[LINK: Text to Display | /path/to/page | type]

Examples:
- For hospitals: [LINK: View Seoul National University Hospital | /hospitals/seoul-national-university-hospital | hospital]
- For procedures: [LINK: Learn more about Rhinoplasty | /procedures/rhinoplasty | procedure]
- For interpreters: [LINK: Browse All Interpreters | /interpreters | interpreter]
- For inquiries: [LINK: Get Free Consultation | /inquiry | inquiry]

ALWAYS include 1-3 relevant links in EVERY response to help users navigate to the information they need.
When you use search tools and find results, ALWAYS create links for those specific results.

You have access to tools to search for hospitals, procedures, and interpreters. Use them to provide accurate, up-to-date information, and ALWAYS include relevant links based on the search results.

IMPORTANT: Always respond in the user's language (determined by the locale parameter).
`;

// Hospital result type for type assertions
interface HospitalSearchResult {
  slug: string;
  name_en: string;
  city: string | null;
  specialties: string[];
  avg_rating: number;
  review_count: number;
  languages: string[];
}

// Tool definitions for the chat - using actual database queries
const searchHospitalsTool = tool({
  description: 'Search for hospitals by specialty, location, or name. When you use this tool, make sure to include [LINK] tags in your response for each hospital found.',
  inputSchema: z.object({
    query: z.string().describe('Search query for hospitals'),
    specialty: z.string().optional().describe('Medical specialty filter'),
    city: z.string().optional().describe('City filter'),
  }),
  execute: async ({ query, specialty, city }) => {
    try {
      const supabase = await createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dbQuery = (supabase.from('hospitals') as any)
        .select('slug, name_en, city, specialties, avg_rating, review_count, languages')
        .eq('status', 'published')
        .order('avg_rating', { ascending: false })
        .limit(5);

      if (specialty) {
        dbQuery = dbQuery.contains('specialties', [specialty]);
      }
      if (city) {
        dbQuery = dbQuery.eq('city', city);
      }
      if (query) {
        dbQuery = dbQuery.or(`name_en.ilike.%${query}%,description_en.ilike.%${query}%`);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Hospital search error:', error);
        return { error: 'Failed to search hospitals', hospitals: [] };
      }

      const hospitals = (data || []) as HospitalSearchResult[];

      return {
        hospitals: hospitals.map(h => ({
          name: h.name_en,
          slug: h.slug,
          city: h.city,
          specialties: h.specialties,
          rating: h.avg_rating,
          reviewCount: h.review_count,
          languages: h.languages,
          link: `/hospitals/${h.slug}`,
        })),
        query,
        filters: { specialty, city },
        instructions: 'IMPORTANT: Include [LINK] tags for each hospital in your response. Format: [LINK: View {Hospital Name} | /hospitals/{slug} | hospital]',
      };
    } catch (error) {
      console.error('Hospital search error:', error);
      return { error: 'Failed to search hospitals', hospitals: [] };
    }
  },
});

// Procedure result type for type assertions
interface ProcedureSearchResult {
  slug: string;
  name_en: string;
  category: string;
  description_en: string | null;
  price_min: number | null;
  price_max: number | null;
  price_currency: string;
  duration_minutes: number | null;
  recovery_days: number | null;
  includes: string[];
  requirements: string[];
  hospitals: { slug: string; name_en: string; city: string | null } | null;
}

const getProcedureInfoTool = tool({
  description: 'Get detailed information about a medical procedure. When you use this tool, make sure to include [LINK] tags in your response for each procedure found.',
  inputSchema: z.object({
    procedure: z.string().describe('Name of the procedure'),
    category: z.string().optional().describe('Procedure category'),
  }),
  execute: async ({ procedure, category }) => {
    try {
      const supabase = await createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dbQuery = (supabase.from('procedures') as any)
        .select(`
          slug, name_en, category, description_en,
          price_min, price_max, price_currency,
          duration_minutes, recovery_days, includes, requirements,
          hospitals!inner(slug, name_en, city)
        `)
        .order('is_popular', { ascending: false })
        .limit(5);

      if (procedure) {
        dbQuery = dbQuery.or(`name_en.ilike.%${procedure}%,category.ilike.%${procedure}%`);
      }
      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Procedure search error:', error);
        return { error: 'Failed to search procedures' };
      }

      const procedures = (data || []) as ProcedureSearchResult[];

      if (procedures.length === 0) {
        return {
          message: `No specific procedures found for "${procedure}". Please contact us for detailed information.`,
          generalInfo: {
            typicalPriceRange: 'Varies by complexity',
            bookingRequired: true,
          },
          instructions: 'Include a link to the inquiry page: [LINK: Get Free Consultation | /inquiry | inquiry]',
        };
      }

      return {
        procedures: procedures.map(p => ({
          name: p.name_en,
          slug: p.slug,
          category: p.category,
          description: p.description_en,
          priceRange: p.price_min && p.price_max
            ? `$${p.price_min.toLocaleString()} - $${p.price_max.toLocaleString()}`
            : 'Contact for pricing',
          duration: p.duration_minutes ? `${p.duration_minutes} minutes` : 'Varies',
          recoveryTime: p.recovery_days ? `${p.recovery_days} days` : 'Varies',
          includes: p.includes || [],
          requirements: p.requirements || [],
          hospital: p.hospitals ? {
            name: p.hospitals.name_en,
            slug: p.hospitals.slug,
          } : null,
          link: `/procedures/${p.slug}`,
        })),
        instructions: 'IMPORTANT: Include [LINK] tags for each procedure in your response. Format: [LINK: Learn about {Procedure Name} | /procedures/{slug} | procedure]',
      };
    } catch (error) {
      console.error('Procedure search error:', error);
      return { error: 'Failed to search procedures' };
    }
  },
});

const createInquiryTool = tool({
  description:
    'Create an inquiry for the user to get a personalized consultation. Always include the inquiry link in your response.',
  inputSchema: z.object({
    procedureInterest: z.string().describe('Procedure or service of interest'),
    additionalNotes: z.string().optional().describe('Additional information'),
  }),
  execute: async ({ procedureInterest, additionalNotes }) => {
    return {
      success: true,
      message:
        'To complete your inquiry, please fill out the consultation form with your contact details.',
      inquiryUrl: `/inquiry?procedure=${encodeURIComponent(procedureInterest)}`,
      procedureInterest,
      additionalNotes,
      instructions: 'IMPORTANT: Include this link in your response: [LINK: Get Free Consultation | /inquiry | inquiry]',
    };
  },
});

// Interpreter result type for type assertions (using author_personas table)
interface InterpreterSearchResult {
  id: string;
  slug: string;
  name: Record<string, string>;
  languages: Array<{ code: string; proficiency: string }>;
  primary_specialty: string;
  secondary_specialties: string[];
  avg_rating: number;
  review_count: number;
}

// Add interpreter search tool
const searchInterpretersTool = tool({
  description: 'Search for medical interpreters by language and specialty. When you use this tool, make sure to include [LINK] tags in your response.',
  inputSchema: z.object({
    language: z.string().describe('Language the interpreter speaks (e.g., en, ko, ja, zh-TW)'),
    specialty: z.string().optional().describe('Medical specialty'),
  }),
  execute: async ({ language, specialty }) => {
    try {
      const supabase = await createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dbQuery = (supabase.from('author_personas') as any)
        .select('id, slug, name, languages, primary_specialty, secondary_specialties, avg_rating, review_count')
        .eq('is_active', true)
        .eq('is_available', true)
        .order('avg_rating', { ascending: false })
        .limit(5);

      if (specialty) {
        dbQuery = dbQuery.eq('primary_specialty', specialty);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Interpreter search error:', error);
        return { error: 'Failed to search interpreters', interpreters: [] };
      }

      const interpreters = (data || []) as InterpreterSearchResult[];

      // Filter by language code
      const filtered = interpreters.filter(interpreter => {
        return interpreter.languages?.some(l =>
          l.code.toLowerCase().includes(language.toLowerCase())
        );
      });

      return {
        interpreters: filtered.map(i => ({
          id: i.id,
          slug: i.slug,
          name: i.name?.en || i.name?.ko || 'Unknown',
          languages: i.languages,
          specialty: i.primary_specialty,
          rating: i.avg_rating,
          reviewCount: i.review_count,
          link: `/interpreters/${i.slug}`,
        })),
        searchedLanguage: language,
        specialty,
        instructions: 'IMPORTANT: Include [LINK] tags for interpreters. Format: [LINK: View {Interpreter Name} | /interpreters/{slug} | interpreter] and also include [LINK: Browse All Interpreters | /interpreters | interpreter]',
      };
    } catch (error) {
      console.error('Interpreter search error:', error);
      return { error: 'Failed to search interpreters', interpreters: [] };
    }
  },
});

export async function POST(req: Request) {
  try {
    const { messages, locale = 'en' }: { messages: Message[]; locale?: string } = await req.json();

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build locale-specific instructions
    const localeInstructions = getLocaleInstructions(locale as Locale);

    // Build the system prompt with locale instructions
    const systemPromptWithContext = `${SYSTEM_PROMPT}\n\n${localeInstructions}`;

    // Stream the response
    const result = await streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPromptWithContext,
      messages,
      tools: {
        searchHospitals: searchHospitalsTool,
        getProcedureInfo: getProcedureInfoTool,
        createInquiry: createInquiryTool,
        searchInterpreters: searchInterpretersTool,
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'An error occurred while processing your request.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Get locale-specific instructions
function getLocaleInstructions(locale: Locale): string {
  const instructions: Record<string, string> = {
    en: 'Respond in English. Be professional and helpful. ALWAYS include [LINK] tags for relevant pages.',
    ko: 'Please respond in Korean (한국어). Be professional and helpful. ALWAYS include [LINK] tags for relevant pages.',
    'zh-TW': 'Please respond in Traditional Chinese (繁體中文). Be warm and professional. ALWAYS include [LINK] tags for relevant pages.',
    'zh-CN': 'Please respond in Simplified Chinese (简体中文). Be warm and professional. ALWAYS include [LINK] tags for relevant pages.',
    ja: 'Please respond in Japanese (日本語). Be polite and formal. ALWAYS include [LINK] tags for relevant pages.',
    th: 'Please respond in Thai (ภาษาไทย). Be respectful and helpful. ALWAYS include [LINK] tags for relevant pages.',
    mn: 'Please respond in Mongolian (Монгол хэл). Be clear and helpful. ALWAYS include [LINK] tags for relevant pages.',
    ru: 'Please respond in Russian (Русский). Be professional and detailed. ALWAYS include [LINK] tags for relevant pages.',
  };

  return instructions[locale] || instructions.en;
}
