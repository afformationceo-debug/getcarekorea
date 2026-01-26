/**
 * Generate SEO-optimized blog posts with interpreter persona
 * Each post targets specific locale based on keywords
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
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

// Locale-specific keywords for medical tourism
const LOCALE_KEYWORDS = {
  en: [
    'best plastic surgery korea',
    'korean medical tourism',
    'medical tourism seoul',
    'cosmetic surgery korea',
    'dental tourism korea',
  ],
  ko: [
    '성형외과 추천',
    '피부과 잘하는곳',
    '치과 임플란트',
    '미용 시술',
    '강남 성형외과',
  ],
  ja: [
    '韓国美容整形',
    '韓国医療観光',
    'ソウル整形外科',
    '韓国皮膚科',
    '韓国歯科治療',
  ],
  'zh-TW': [
    '韓國整形',
    '韓國醫美',
    '首爾整形外科',
    '韓國牙科',
    '韓國皮膚科',
  ],
  'zh-CN': [
    '韩国整形',
    '韩国医美',
    '首尔整形外科',
    '韩国牙科',
    '韩国皮肤科',
  ],
  th: [
    'ศัลยกรรมเกาหลี',
    'ท่องเที่ยวเชิงการแพทย์เกาหลี',
    'คลินิกผิวหนังเกาหลี',
    'ทันตกรรมเกาหลี',
    'ศัลยกรรมตกแต่งเกาหลี',
  ],
  mn: [
    'солонгос гоо сайхны мэс засал',
    'солонгос эмчилгээний аялал',
    'сеул гоо сайхны мэс засал',
    'солонгос арьс арчилгаа',
    'солонгос шүдний эмнэлэг',
  ],
  ru: [
    'пластическая хирургия корея',
    'медицинский туризм корея',
    'косметические процедуры сеул',
    'стоматология корея',
    'дерматология корея',
  ],
} as const;

type LocaleKey = keyof typeof LOCALE_KEYWORDS;

const LOCALE_NAMES: Record<LocaleKey, string> = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  'zh-TW': 'Traditional Chinese',
  'zh-CN': 'Simplified Chinese',
  th: 'Thai',
  mn: 'Mongolian',
  ru: 'Russian',
};

const TARGET_COUNTRIES: Record<LocaleKey, string> = {
  en: 'US',
  ko: 'KR',
  ja: 'JP',
  'zh-TW': 'TW',
  'zh-CN': 'CN',
  th: 'TH',
  mn: 'MN',
  ru: 'RU',
};

interface BlogPostData {
  slug: string;
  category: string;
  tags: string[];
  keywords: string[];
  target_locale: string;
  target_country: string;
  title_en: string;
  excerpt_en: string;
  content_en: string;
  [key: string]: unknown;
}

/**
 * Generate blog post with interpreter persona
 */
async function generateBlogPost(
  keyword: string,
  targetLocale: LocaleKey
): Promise<BlogPostData> {
  console.log(`\n📝 Generating blog post for keyword: "${keyword}" (${LOCALE_NAMES[targetLocale]})`);

  const systemPrompt = `You are an experienced medical interpreter working in Seoul, South Korea, specializing in Korean medical tourism. You help international patients navigate the Korean healthcare system.

CRITICAL REQUIREMENTS:
1. Write from the perspective of a medical interpreter (first-person "I")
2. Share personal experiences and anecdotes from your work
3. Include practical tips and insider knowledge
4. Be conversational, warm, and helpful
5. Focus on SEO optimization for the keyword: "${keyword}"
6. Target audience: ${LOCALE_NAMES[targetLocale]}-speaking patients considering medical tourism in Korea
7. Length: 1500-2000 words
8. Include specific hospital/clinic names and locations in Seoul

STRUCTURE:
- Compelling title (SEO-optimized with keyword)
- Personal introduction (why you became a medical interpreter)
- Main content with 3-5 sections
- Practical tips and advice
- Call to action

Respond in JSON format:
{
  "title": "SEO-optimized title in English",
  "excerpt": "Compelling 2-sentence excerpt",
  "content": "Full markdown content",
  "category": "medical-tourism|plastic-surgery|dermatology|dental|ophthalmology",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `Generate a blog post about: ${keyword}

Write as a medical interpreter sharing insider knowledge and personal experiences. Make it authentic, helpful, and SEO-optimized.`,
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const blogData = JSON.parse(jsonMatch[0]);

    // Create slug from title
    const slug = blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return {
      slug: `${slug}-${Date.now()}`,
      category: blogData.category,
      tags: blogData.tags,
      keywords: [keyword],
      target_locale: targetLocale,
      target_country: TARGET_COUNTRIES[targetLocale],
      title_en: blogData.title,
      excerpt_en: blogData.excerpt,
      content_en: blogData.content,
    };
  } catch (error) {
    console.error(`Error generating blog post:`, error);
    throw error;
  }
}

/**
 * Translate blog post to target locale
 */
async function translateBlogPost(
  post: BlogPostData,
  targetLocale: LocaleKey
): Promise<Partial<BlogPostData>> {
  if (targetLocale === 'en') {
    return {}; // English is source
  }

  console.log(`   🌍 Translating to ${LOCALE_NAMES[targetLocale]}...`);

  const systemPrompt = `You are a professional medical translator specializing in Korean medical tourism content.
Translate the following blog post content to ${LOCALE_NAMES[targetLocale]}.

CRITICAL REQUIREMENTS:
- Maintain the interpreter persona and personal tone
- Keep medical terminology accurate
- Preserve all formatting (markdown, headers, lists)
- Keep proper nouns (hospital names, locations) unchanged
- Ensure SEO optimization is maintained

Respond in JSON format:
{
  "title": "Translated title",
  "excerpt": "Translated excerpt",
  "content": "Translated markdown content"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Title: ${post.title_en}

Excerpt: ${post.excerpt_en}

Content:
${post.content_en}`,
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const translated = JSON.parse(jsonMatch[0]);

    const localeFieldSuffix = targetLocale.replace('-', '_').toLowerCase();
    return {
      [`title_${localeFieldSuffix}`]: translated.title,
      [`excerpt_${localeFieldSuffix}`]: translated.excerpt,
      [`content_${localeFieldSuffix}`]: translated.content,
    };
  } catch (error) {
    console.error(`Translation error for ${targetLocale}:`, error);
    return {};
  }
}

/**
 * Save blog post to database
 */
async function saveBlogPost(post: BlogPostData): Promise<void> {
  const { error } = await supabase.from('blog_posts').insert([
    {
      ...post,
      status: 'published',
      published_at: new Date().toISOString(),
      view_count: 0,
      author_id: null,
    },
  ]);

  if (error) {
    console.error('Error saving blog post:', error);
    throw error;
  }

  console.log(`   ✅ Saved: ${post.slug}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const targetLocale = (args[0] as LocaleKey) || null;
  const count = parseInt(args[1]) || 5;

  console.log('🌍 Interpreter Blog Post Generator');
  console.log('==================================\n');

  if (targetLocale && !LOCALE_KEYWORDS[targetLocale]) {
    console.error(`Invalid locale: ${targetLocale}`);
    console.error(
      `Valid locales: ${Object.keys(LOCALE_KEYWORDS).join(', ')}`
    );
    process.exit(1);
  }

  const localesToProcess = targetLocale
    ? [targetLocale]
    : (Object.keys(LOCALE_KEYWORDS) as LocaleKey[]);

  for (const locale of localesToProcess) {
    console.log(`\n📍 Processing locale: ${LOCALE_NAMES[locale]} (${TARGET_COUNTRIES[locale]})`);
    console.log('─'.repeat(70));

    const keywords = LOCALE_KEYWORDS[locale].slice(0, count);

    for (const keyword of keywords) {
      try {
        // Generate blog post in English
        const post = await generateBlogPost(keyword, locale);

        // Translate to target locale (if not English)
        if (locale !== 'en') {
          const translation = await translateBlogPost(post, locale);
          Object.assign(post, translation);
        }

        // Save to database
        await saveBlogPost(post);

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to process keyword "${keyword}":`, error);
        continue;
      }
    }
  }

  console.log('\n✅ Blog post generation complete!');
}

main().catch(console.error);
