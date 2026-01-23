/**
 * Test Content Generation and Publishing with Images
 *
 * Usage: npx tsx scripts/test-publish.ts
 *
 * Features:
 * - DALL-E 3 image generation
 * - AI Summary for AEO
 * - Rich SEO structure (h2, bullet points, tables, schema)
 * - Author persona matching
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

if (!anthropicApiKey) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

if (!openaiApiKey) {
  console.warn('⚠️ Missing OPENAI_API_KEY - images will not be generated');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anthropic = new Anthropic({ apiKey: anthropicApiKey });
const openai = new OpenAI({ apiKey: openaiApiKey || 'missing-key' });

// =====================================================
// IMAGE GENERATION
// =====================================================

interface ImageMetadata {
  position: string;
  placeholder: string;
  prompt: string;
  alt: string;
  caption?: string;
}

interface GeneratedImage {
  placeholder: string;
  url: string;
  alt: string;
  prompt: string;
}

async function generateImages(images: ImageMetadata[], keyword: string): Promise<GeneratedImage[]> {
  if (!openaiApiKey) {
    console.log('   ⚠️ Skipping image generation (no API key)');
    return [];
  }

  const generated: GeneratedImage[] = [];

  for (const img of images) {
    console.log(`   🎨 Generating: ${img.placeholder}...`);

    try {
      // Cute kawaii-style cartoon illustration - friendly and approachable
      const enhancedPrompt = `CUTE KAWAII CARTOON STYLE: ${img.prompt}

STYLE: Adorable kawaii-inspired cartoon illustration
- Cute, rounded character designs with big expressive eyes
- Soft pastel color palette (pink, mint, lavender, peach, baby blue)
- Simple, clean lines with minimal details
- Chibi-style proportions (big heads, small bodies)
- Friendly, warm, and approachable feel

CHARACTER DESIGN:
- Round, simplified faces with rosy cheeks
- Small dot noses, simple curved smiles
- Large sparkly eyes (anime/kawaii style)
- Soft, fluffy hair with simple shapes
- Cute simplified hands (mitten-style or simple)

COLOR PALETTE:
- Primary: Soft pink (#FFB6C1), Mint green (#98FB98), Lavender (#E6E6FA)
- Accent: Peach (#FFDAB9), Baby blue (#89CFF0), Cream (#FFFDD0)
- Warm undertones throughout

SETTING/ELEMENTS:
- Cute simplified medical equipment with faces/personalities
- Sparkles, stars, hearts, and small decorative elements
- Soft gradient backgrounds (pastel to white)
- Fluffy clouds or soft shapes as decorations
- Little emoji-style icons scattered around

MOOD:
- Warm, comforting, and reassuring
- Professional but approachable
- Makes medical topics feel less intimidating
- Like a friendly children's book illustration

ABSOLUTELY AVOID:
- Realistic human proportions
- Scary or clinical medical imagery
- Dark or harsh colors
- Complex detailed backgrounds
- Anything that looks AI-generated or uncanny

This should look like it belongs in a cute Korean/Japanese lifestyle magazine or a friendly healthcare app.`;

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1792x1024', // Wider aspect ratio for editorial look
        quality: 'hd',
        style: 'vivid', // Vivid for illustration style
      });

      if (response.data && response.data[0]?.url) {
        generated.push({
          placeholder: img.placeholder,
          url: response.data[0].url,
          alt: `${keyword} - ${img.alt}, Seoul, South Korea`,
          prompt: img.prompt,
        });
        console.log(`   ✅ ${img.placeholder}: Generated`);
      }
    } catch (error: any) {
      console.error(`   ❌ ${img.placeholder}: ${error.message}`);
    }

    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return generated;
}

function injectImagesIntoHTML(html: string, images: GeneratedImage[]): string {
  let result = html;

  for (const img of images) {
    // Replace placeholder with actual image
    const placeholderPattern = new RegExp(
      `<img[^>]*src=["']\\${img.placeholder.replace(/[[\]]/g, '\\$&')}["'][^>]*>`,
      'gi'
    );
    const newImgTag = `<img src="${img.url}" alt="${img.alt}" class="content-image" loading="lazy" />`;
    result = result.replace(placeholderPattern, newImgTag);

    // Also handle plain placeholder text
    result = result.replace(img.placeholder, newImgTag);
  }

  return result;
}

// =====================================================
// MAIN FUNCTION
// =====================================================

async function generateAndPublish() {
  const keyword = 'rhinoplasty korea cost';
  const locale = 'en';
  const category = 'plastic-surgery';

  console.log(`\n🚀 Generating premium content for: "${keyword}" (${locale})\n`);

  // System prompt with SEO/AEO optimization
  const systemPrompt = `You are a medical tourism content expert for GetCareKorea. Create premium SEO/AEO optimized content.

## LANGUAGE: 100% English (no Korean text)

## OUTPUT FORMAT (JSON):
{
  "title": "SEO title (60 chars max)",
  "excerpt": "Meta description (150-160 chars)",
  "content": "FULL HTML with rich formatting",
  "contentFormat": "html",
  "metaTitle": "SEO browser title",
  "metaDescription": "Meta description",
  "aiSummary": {
    "keyTakeaways": [
      "First key insight with specific number",
      "Second key benefit or advantage",
      "Third practical tip for patients"
    ],
    "quickAnswer": "Direct answer in 40-60 words for featured snippets",
    "targetAudience": "Who this is best for",
    "estimatedCost": "$X,XXX - $XX,XXX",
    "recommendedStay": "X-X days",
    "recoveryTime": "X-X weeks"
  },
  "tags": ["keyword1", "keyword2", "korea", "medical-tourism"],
  "faqSchema": [
    {"question": "Natural FAQ question?", "answer": "Direct answer first, then explanation (40-60 words)"}
  ],
  "howToSchema": [
    {"name": "Step 1: Initial Consultation", "text": "Step description with timeline"}
  ],
  "images": [
    {
      "position": "after-tldr",
      "placeholder": "[IMAGE_PLACEHOLDER_1]",
      "prompt": "Korean plastic surgeon in consultation room with patient, modern Gangnam clinic, natural lighting",
      "alt": "Rhinoplasty consultation at Korean clinic"
    }
  ]
}

## CONTENT REQUIREMENTS:

### 1. TL;DR Summary Box (TOP OF ARTICLE)
\`\`\`html
<div class="tldr-box">
  <h3>⚡ Quick Summary</h3>
  <ul>
    <li><strong>Cost:</strong> $2,500 - $8,000 (50-70% less than US)</li>
    <li><strong>Duration:</strong> 10-14 days recommended stay</li>
    <li><strong>Best for:</strong> [specific patient types]</li>
    <li><strong>Key advantage:</strong> [main benefit]</li>
  </ul>
</div>
\`\`\`

### 2. Featured Snippet Answer
First 40-60 words must directly answer the query with specific numbers.

### 3. Rich HTML Elements (MUST INCLUDE):
- <strong> tags on key terms
- <div class="highlight-box"> for expert tips
- <div class="warning-box"> for important cautions
- <table class="comparison-table"> for cost comparisons
- Proper <h2> and <h3> headings
- <ul> and <ol> lists for readability

### 4. Comparison Table (REQUIRED)
\`\`\`html
<table class="comparison-table">
  <thead><tr><th>Procedure</th><th>Korea</th><th>USA</th><th>Savings</th></tr></thead>
  <tbody>
    <tr><td>Basic Rhinoplasty</td><td>$2,500</td><td>$8,000</td><td>69%</td></tr>
  </tbody>
</table>
\`\`\`

### 5. FAQ Section (5-7 questions)
Each FAQ answer: direct answer first, then explanation.

### 6. Images (5 REQUIRED)
Include 5 images with CUTE KAWAII CARTOON style prompts:
- Adorable chibi-style characters with big eyes and rosy cheeks
- Soft pastel colors (pink, mint, lavender, peach, baby blue)
- Cute simplified medical elements with friendly personalities
- Sparkles, hearts, and decorative elements
- Warm, comforting, approachable mood - NOT scary medical imagery

### 7. Content Length: 1500-2500 words

## FORBIDDEN:
- Empty HTML tags
- Multiple <br> in a row
- Generic filler content
- Korean text (unless locale is Korean)`;

  const userPrompt = `Create a comprehensive blog article about "${keyword}".

The article MUST cover:
1. TL;DR summary box with exact cost range ($2,500-$8,000)
2. Why Korea is #1 for rhinoplasty (statistics, surgeon expertise)
3. Types of rhinoplasty (ethnic rhinoplasty, revision, augmentation)
4. Detailed cost comparison table (Korea vs USA vs Thailand)
5. Step-by-step patient journey (how-to schema)
6. Recovery timeline with specific days/weeks
7. How to choose the right clinic (expert tips)
8. 5-7 FAQs targeting "People Also Ask"
9. 5 photorealistic image placeholders (spread throughout the article)

Make it rank #1 on Google with featured snippet potential.`;

  try {
    const startTime = Date.now();

    console.log('📝 Generating content with Claude...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Content generated in ${generationTime}s`);

    // Parse the response
    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON
    let jsonStr = textContent.text.trim();

    // Try multiple extraction strategies
    const jsonBlockMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      jsonStr = jsonBlockMatch[1].trim();
    } else if (!jsonStr.startsWith('{')) {
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
    }

    const content = JSON.parse(jsonStr);
    console.log(`📝 Title: ${content.title}`);
    console.log(`📊 AI Summary: ${content.aiSummary ? 'Yes' : 'No'}`);
    console.log(`❓ FAQs: ${content.faqSchema?.length || 0}`);
    console.log(`🖼️ Images: ${content.images?.length || 0}`);

    // Generate images with DALL-E 3
    let finalContent = content.content;
    let generatedImages: GeneratedImage[] = [];

    if (content.images && content.images.length > 0) {
      console.log(`\n🎨 Generating ${content.images.length} images with DALL-E 3...`);
      generatedImages = await generateImages(content.images, keyword);

      if (generatedImages.length > 0) {
        finalContent = injectImagesIntoHTML(content.content, generatedImages);
        console.log(`✅ ${generatedImages.length} images injected into content`);
      }
    }

    // Find matching author persona
    let authorPersonaId: string | null = null;
    try {
      const { data: personas } = await supabase
        .from('author_personas')
        .select('id, slug, target_locales')
        .eq('is_active', true)
        .contains('target_locales', [locale]);

      if (personas && personas.length > 0) {
        authorPersonaId = personas[0].id;
        console.log(`✅ Matched author persona: ${personas[0].slug}`);
      }
    } catch (e) {
      console.warn('⚠️ Could not find author persona');
    }

    // Generate slug
    const slug = keyword
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now();

    // Save to database
    console.log(`\n💾 Saving to database...`);

    const imageCost = generatedImages.length * 0.08; // HD quality
    const totalCost = 0.015 + imageCost; // Rough estimate

    const blogPostData = {
      slug,
      title_en: content.title,
      excerpt_en: content.excerpt,
      content_en: finalContent,
      meta_title_en: content.metaTitle,
      meta_description_en: content.metaDescription,
      category,
      tags: content.tags,
      author_persona_id: authorPersonaId,
      status: 'published',
      published_at: new Date().toISOString(),
      generation_metadata: {
        keyword,
        locale,
        generationTime: `${generationTime}s`,
        model: 'claude-sonnet-4-20250514',
        aiSummary: content.aiSummary,
        faqSchema: content.faqSchema,
        howToSchema: content.howToSchema,
        images: content.images,
        generatedImages: generatedImages,
        imageCost,
        totalCost,
      }
    };

    const { data: savedPost, error: saveError } = await supabase
      .from('blog_posts')
      .insert(blogPostData)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Save error:', saveError.message);
      throw saveError;
    }

    console.log(`✅ Saved and published: ${savedPost.id}`);
    console.log(`\n🔗 View at: https://getcarekorea.vercel.app/en/blog/${slug}`);

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   - Keyword: ${keyword}`);
    console.log(`   - Locale: ${locale}`);
    console.log(`   - Title: ${content.title}`);
    console.log(`   - Status: Published`);
    console.log(`   - Images: ${generatedImages.length}/${content.images?.length || 0}`);
    console.log(`   - FAQs: ${content.faqSchema?.length || 0}`);
    console.log(`   - AI Summary: ${content.aiSummary ? 'Yes' : 'No'}`);
    console.log(`   - Cost: $${totalCost.toFixed(3)}`);

    return savedPost;

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run
generateAndPublish()
  .then(() => {
    console.log('\n✅ Test publish complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test publish failed:', error);
    process.exit(1);
  });
