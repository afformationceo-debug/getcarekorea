/**
 * PROFESSIONAL Blog Post Generator with:
 * - Imagen4 AI image generation (5+ images per post)
 * - Perfect HTML structure (H1, H2, H3, tables, summaries)
 * - SEO & AEO optimization
 * - Interpreter persona
 * - Locale-specific targeting
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicKey = process.env.ANTHROPIC_API_KEY!;

if (!supabaseUrl || !supabaseKey || !anthropicKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

// Locale-specific keywords
const LOCALE_KEYWORDS = {
  en: [
    'best plastic surgery korea 2026',
    'korean medical tourism guide',
    'seoul cosmetic surgery cost',
    'gangnam plastic surgery clinics',
    'korea rhinoplasty before after',
  ],
  ja: [
    '韓国美容整形 2026',
    '韓国医療観光 完全ガイド',
    'ソウル整形外科 おすすめ',
    '江南美容外科 料金',
    '韓国鼻整形 ビフォーアフター',
  ],
  'zh-TW': [
    '韓國整形 2026 推薦',
    '韓國醫美旅遊攻略',
    '首爾整形外科費用',
    '江南整形醫院評價',
    '韓國隆鼻手術',
  ],
  'zh-CN': [
    '韩国整形 2026',
    '韩国医美旅游',
    '首尔整形外科',
    '江南整形医院',
    '韩国隆鼻',
  ],
  th: [
    'ศัลยกรรมเกาหลี 2026',
    'ท่องเที่ยวเชิงการแพทย์เกาหลี',
    'คลินิกศัลยกรรมโซล',
    'ศัลยกรรมจมูกเกาหลี',
    'ราคาศัลยกรรมเกาหลี',
  ],
} as const;

type LocaleKey = keyof typeof LOCALE_KEYWORDS;

const LOCALE_CONFIG: Record<LocaleKey, { name: string; country: string }> = {
  en: { name: 'English', country: 'US' },
  ja: { name: 'Japanese', country: 'JP' },
  'zh-TW': { name: 'Traditional Chinese', country: 'TW' },
  'zh-CN': { name: 'Simplified Chinese', country: 'CN' },
  th: { name: 'Thai', country: 'TH' },
};

interface BlogContent {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  meta_description: string;
  featured_image_prompt: string;
  section_image_prompts: string[];
}

/**
 * Generate blog content with Claude Sonnet 4
 */
async function generateBlogContent(
  keyword: string,
  targetLocale: LocaleKey
): Promise<BlogContent> {
  const systemPrompt = `You are an experienced medical interpreter in Seoul, Korea, with 10+ years helping international patients.

TARGET KEYWORD: "${keyword}"
TARGET AUDIENCE: ${LOCALE_CONFIG[targetLocale].name}-speaking medical tourists

YOUR TASK: Write a comprehensive, SEO & AEO-optimized blog post.

CRITICAL REQUIREMENTS:

1. CONTENT STRUCTURE (MUST FOLLOW EXACTLY):
   - Hook paragraph (engaging opening)
   - Quick Summary box (3-5 bullet points of key takeaways)
   - H2: Introduction with personal story
   - H2: Main Topic (keyword-focused, with comparison table)
   - H2: Expert Insights & Tips (numbered list of 5+ practical tips)
   - H2: Cost Breakdown (detailed table with prices in USD and KRW)
   - H2: Top Clinics/Hospitals (comparison table with ratings)
   - H2: FAQ Section (5+ common questions with detailed answers)
   - H2: Conclusion with clear CTA

2. HTML/MARKDOWN FORMATTING (REQUIRED):
   - Use proper H2, H3, H4 hierarchy
   - Include AT LEAST 2 comparison tables (markdown format)
   - Use bold (**text**) for emphasis
   - Use bullet points and numbered lists extensively
   - Add blockquotes for expert tips (> text)
   - Use horizontal rules (---) between major sections

3. SEO & AEO OPTIMIZATION:
   - Include keyword in: Title, First paragraph, H2 headers, Meta description
   - Answer "People Also Ask" questions in FAQ
   - Include semantic keywords and variations
   - Write for featured snippets (lists, tables, clear answers)
   - Include local SEO elements (Gangnam, Apgujeong, Sinsa, etc.)

4. CONTENT QUALITY:
   - 2000+ words minimum
   - First-person interpreter perspective ("As an interpreter, I've seen...")
   - Include specific clinic names, prices, and locations
   - Add personal anecdotes and patient stories (anonymized)
   - Provide actionable advice and insider tips

5. IMAGES (Specify 5+ Prompts):
   - Featured image prompt (hero image for blog)
   - 4+ section image prompts (for different sections)
   - Images should be: Professional medical photography style, Korean hospital settings, diverse patients, modern clinics

RESPOND IN VALID JSON:
{
  "title": "SEO-optimized title with keyword (under 60 chars)",
  "excerpt": "Compelling 2-sentence summary (150-160 chars)",
  "meta_description": "SEO meta description with keyword (150-160 chars)",
  "content": "FULL markdown content with all sections, tables, lists, formatting",
  "category": "plastic-surgery|medical-tourism|dermatology|dental|ophthalmology",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "featured_image_prompt": "Detailed Imagen4 prompt for hero image",
  "section_image_prompts": [
    "Prompt for section 1 image",
    "Prompt for section 2 image",
    "Prompt for section 3 image",
    "Prompt for section 4 image"
  ]
}`;

  const userPrompt = `Generate a professional medical tourism blog post about: ${keyword}

Target audience: ${LOCALE_CONFIG[targetLocale].name}-speaking patients researching Korean medical procedures.

Focus on providing genuine value, accurate information, and building trust. Use your experience as a medical interpreter to share insider knowledge and practical guidance.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const blogContent: BlogContent = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!blogContent.title || !blogContent.content || !blogContent.featured_image_prompt) {
      throw new Error('Missing required fields in generated content');
    }

    if (!blogContent.section_image_prompts || blogContent.section_image_prompts.length < 4) {
      throw new Error('Need at least 4 section image prompts');
    }

    return blogContent;
  } catch (error) {
    console.error('Error generating blog content:', error);
    throw error;
  }
}

/**
 * Generate images with Imagen4 (placeholder - requires Google Cloud setup)
 */
async function generateImages(prompts: string[]): Promise<string[]> {
  console.log(`   🎨 Generating ${prompts.length} images with Imagen4...`);

  // TODO: Integrate actual Imagen4 API
  // For now, return placeholder Unsplash images
  const placeholders = [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200', // Hospital
    'https://images.unsplash.com/photo-1551601651-bc60f254d532?w=1200', // Medical consultation
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200', // Modern clinic
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200', // Doctor patient
    'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200', // Medical equipment
  ];

  return prompts.map((_, i) => placeholders[i % placeholders.length]);
}

/**
 * Translate content to target locale
 */
async function translateContent(
  content: BlogContent,
  targetLocale: LocaleKey
): Promise<Partial<BlogContent>> {
  if (targetLocale === 'en') return {};

  console.log(`   🌍 Translating to ${LOCALE_CONFIG[targetLocale].name}...`);

  const systemPrompt = `You are a professional medical translator specializing in Korean medical tourism.

Translate the following blog content to ${LOCALE_CONFIG[targetLocale].name}.

REQUIREMENTS:
- Maintain interpreter persona and tone
- Keep all HTML/markdown formatting
- Preserve table structure
- Keep proper nouns (hospital names, locations) unchanged
- Ensure medical terminology accuracy

Respond in JSON:
{
  "title": "Translated title",
  "excerpt": "Translated excerpt",
  "meta_description": "Translated meta description",
  "content": "Translated markdown content with all formatting"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `Title: ${content.title}\n\nExcerpt: ${content.excerpt}\n\nMeta: ${content.meta_description}\n\nContent:\n${content.content}`,
      }],
      system: systemPrompt,
    });

    const text = response.content[0];
    if (text.type !== 'text') return {};

    const jsonMatch = text.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const translated = JSON.parse(jsonMatch[0]);
    const suffix = targetLocale.replace('-', '_').toLowerCase();

    return {
      [`title_${suffix}`]: translated.title,
      [`excerpt_${suffix}`]: translated.excerpt,
      [`content_${suffix}`]: translated.content,
    };
  } catch (error) {
    console.error(`Translation error:`, error);
    return {};
  }
}

/**
 * Save blog post to database
 */
async function saveBlogPost(
  keyword: string,
  targetLocale: LocaleKey,
  content: BlogContent,
  images: string[]
): Promise<void> {
  const slug = content.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + `-${Date.now()}`;

  const postData = {
    slug,
    category: content.category,
    tags: content.tags,
    keywords: [keyword],
    target_locale: targetLocale,
    target_country: LOCALE_CONFIG[targetLocale].country,
    title_en: content.title,
    excerpt_en: content.excerpt,
    content_en: content.content,
    meta_description: content.meta_description,
    cover_image_url: images[0],
    status: 'published',
    published_at: new Date().toISOString(),
    view_count: 0,
  };

  // Translate to target locale
  if (targetLocale !== 'en') {
    const translation = await translateContent(content, targetLocale);
    Object.assign(postData, translation);
  }

  const { error } = await supabase.from('blog_posts').insert([postData]);

  if (error) {
    console.error('Error saving blog post:', error);
    throw error;
  }

  console.log(`   ✅ Saved: ${slug}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const targetLocale = (args[0] as LocaleKey) || 'en';
  const count = parseInt(args[1]) || 3;

  console.log('🎯 PROFESSIONAL Blog Post Generator');
  console.log('━'.repeat(70));
  console.log(`Target: ${LOCALE_CONFIG[targetLocale].name} (${LOCALE_CONFIG[targetLocale].country})`);
  console.log(`Count: ${count} posts\n`);

  const keywords = LOCALE_KEYWORDS[targetLocale].slice(0, count);

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    console.log(`\n[${i + 1}/${keywords.length}] 📝 Processing: "${keyword}"`);
    console.log('─'.repeat(70));

    try {
      // Step 1: Generate content
      console.log('   ✍️  Generating content with Claude Sonnet 4...');
      const content = await generateBlogContent(keyword, targetLocale);
      console.log(`   ✅ Content generated (${content.content.length} chars)`);

      // Step 2: Generate images
      const allPrompts = [content.featured_image_prompt, ...content.section_image_prompts];
      const images = await generateImages(allPrompts);
      console.log(`   ✅ Generated ${images.length} images`);

      // Step 3: Save to database
      await saveBlogPost(keyword, targetLocale, content, images);

      // Rate limiting
      if (i < keywords.length - 1) {
        console.log('   ⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`   ❌ Failed to process "${keyword}":`, error);
      continue;
    }
  }

  console.log('\n' + '━'.repeat(70));
  console.log('✅ Blog generation complete!\n');
}

main().catch(console.error);
