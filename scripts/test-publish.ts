/**
 * Test Content Generation and Publishing with Images
 *
 * Usage: npx tsx scripts/test-publish.ts
 *
 * Features:
 * - Flux Pro 1.1 image generation (ultra-realistic)
 * - Fallback to DALL-E 3 if Replicate not configured
 * - AI Summary for AEO
 * - Rich SEO structure (h2, bullet points, tables, schema)
 * - Author persona matching
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Replicate from 'replicate';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;
const replicateApiToken = process.env.REPLICATE_API_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

if (!anthropicApiKey) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

// Check image generation capabilities
// Use Imagen 4 (Google's best) via Replicate
const useImagen4 = !!replicateApiToken;
if (useImagen4) {
  console.log('✅ Replicate API configured - using Google Imagen 4 (ultra-realistic)');
} else if (openaiApiKey) {
  console.log('⚠️ No Replicate API - falling back to DALL-E 3');
} else {
  console.warn('⚠️ No image API configured - images will not be generated');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anthropic = new Anthropic({ apiKey: anthropicApiKey });
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
const replicate = replicateApiToken ? new Replicate({ auth: replicateApiToken }) : null;

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

/**
 * Generate images using Google Imagen 4 (preferred) or DALL-E 3 (fallback)
 *
 * Imagen 4 advantages:
 * - Google's latest and best image model
 * - Exceptional photorealism
 * - Natural human features
 * - Better text rendering
 */
async function generateImages(images: ImageMetadata[], keyword: string): Promise<GeneratedImage[]> {
  if (useImagen4 && replicate) {
    return generateImagesWithImagen4(images, keyword);
  } else if (openai) {
    return generateImagesWithDallE(images, keyword);
  } else {
    console.log('   ⚠️ Skipping image generation (no API key)');
    return [];
  }
}

/**
 * Google Imagen 4 - Google's best image generation model
 */
async function generateImagesWithImagen4(images: ImageMetadata[], keyword: string): Promise<GeneratedImage[]> {
  const generated: GeneratedImage[] = [];

  console.log(`\n🎨 Using Google Imagen 4 (ultra-realistic mode)`);

  for (const img of images) {
    console.log(`   📸 Generating: ${img.placeholder}...`);

    try {
      // Imagen 4 optimized prompt
      const imagenPrompt = `Professional documentary photography: ${img.prompt}

Modern Korean medical clinic in Gangnam, Seoul.
Natural window lighting, clean minimalist interior.
Real people with natural expressions, candid moment.
Photojournalistic style, authentic atmosphere.
Sharp focus, natural depth of field.`;

      const output = await replicate!.run('google/imagen-4', {
        input: {
          prompt: imagenPrompt,
          aspect_ratio: '16:9',
          output_format: 'jpg',
          safety_filter_level: 'block_medium_and_above',
        },
      });

      // Imagen 4 returns an array of URLs
      const imageUrl = Array.isArray(output) ? output[0] : (typeof output === 'string' ? output : String(output));

      if (imageUrl && imageUrl.startsWith('http')) {
        generated.push({
          placeholder: img.placeholder,
          url: imageUrl,
          alt: `${keyword} - ${img.alt}, Seoul, South Korea`,
          prompt: img.prompt,
        });
        console.log(`   ✅ ${img.placeholder}: Generated (Imagen 4)`);
      } else {
        throw new Error('Invalid URL returned');
      }
    } catch (error: any) {
      console.error(`   ❌ ${img.placeholder}: ${error.message}`);
    }

    // Longer delay for rate limiting (free tier)
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  return generated;
}

/**
 * DALL-E 3 fallback - Still good, but more AI-looking
 */
async function generateImagesWithDallE(images: ImageMetadata[], keyword: string): Promise<GeneratedImage[]> {
  const generated: GeneratedImage[] = [];

  console.log(`\n🎨 Using DALL-E 3 (fallback mode)`);

  for (const img of images) {
    console.log(`   🎨 Generating: ${img.placeholder}...`);

    try {
      const enhancedPrompt = `Professional documentary photography: ${img.prompt}

Shot on Canon EOS R5, 35mm lens, f/2.8, natural lighting.
Modern Korean medical clinic in Gangnam, Seoul.
Real people with natural expressions and visible skin texture.
Candid moment, not posed. Photojournalistic style.

CRITICAL: Must look like real photography, not AI-generated.
Natural imperfections, asymmetric features, authentic atmosphere.`;

      const response = await openai!.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1792x1024',
        quality: 'hd',
        style: 'natural',
      });

      if (response.data && response.data[0]?.url) {
        generated.push({
          placeholder: img.placeholder,
          url: response.data[0].url,
          alt: `${keyword} - ${img.alt}, Seoul, South Korea`,
          prompt: img.prompt,
        });
        console.log(`   ✅ ${img.placeholder}: Generated (DALL-E 3)`);
      }
    } catch (error: any) {
      console.error(`   ❌ ${img.placeholder}: ${error.message}`);
    }

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

  // System prompt - Personal blog style like a real interpreter wrote it
  const systemPrompt = `You are Sophia Chen, a real medical tourism interpreter in Seoul with 8+ years of experience.
Write like you're sharing your personal knowledge on YOUR blog - authentic, warm, helpful.

## YOUR PERSONA:
- Name: Sophia Chen (소피아 첸)
- Role: Senior Medical Tourism Coordinator at GetCareKorea
- Experience: 8+ years helping international patients
- Languages: English, Korean, Mandarin
- Personality: Warm, professional, genuinely caring, honest about pros AND cons

## WRITING STYLE - CRITICAL:
1. **First Person Voice**: Use "I", "my patients", "in my experience"
2. **Real Stories**: Include brief anonymized patient stories ("Last month, a patient from California...")
3. **Honest & Balanced**: Mention both benefits AND realistic challenges
4. **Conversational**: Like talking to a friend, not a medical textbook
5. **Personal Touch**: Share YOUR opinions, tips that only an insider would know
6. **Call to Action**: Naturally invite readers to reach out to YOU for help

## TONE EXAMPLES:
✅ "I've helped over 200 rhinoplasty patients, and here's what I tell every single one of them..."
✅ "Honestly? The recovery is harder than most clinics admit. But here's how we make it easier..."
✅ "My favorite tip that most blogs won't tell you: always book your follow-up BEFORE surgery day."
✅ "One thing that frustrates me about other coordinators - they overpromise. I won't do that."

❌ "Rhinoplasty in Korea is a popular procedure..." (too generic, no personality)
❌ "Patients should consider..." (third person, cold)

## OUTPUT FORMAT (JSON):
{
  "title": "SEO title with keyword (60 chars max)",
  "excerpt": "Personal hook that makes reader want to learn more (150-160 chars)",
  "content": "FULL HTML - personal blog style with rich formatting",
  "contentFormat": "html",
  "metaTitle": "SEO browser title",
  "metaDescription": "Meta description with personal touch",
  "aiSummary": {
    "keyTakeaways": [
      "Insider tip #1 with specific number",
      "Honest insight #2 about the process",
      "Personal recommendation #3"
    ],
    "quickAnswer": "Direct answer from my experience (40-60 words)",
    "targetAudience": "Who I recommend this for",
    "estimatedCost": "$X,XXX - $XX,XXX",
    "recommendedStay": "X-X days",
    "recoveryTime": "X-X weeks"
  },
  "tags": ["keyword1", "keyword2", "korea", "medical-tourism"],
  "faqSchema": [
    {"question": "Question patients actually ask me?", "answer": "My honest answer from experience (40-60 words)"}
  ],
  "howToSchema": [
    {"name": "Step 1: Initial Consultation", "text": "How I guide my patients through this step"}
  ],
  "images": [
    {
      "position": "after-intro",
      "placeholder": "[IMAGE_PLACEHOLDER_1]",
      "prompt": "Description for realistic clinic photo",
      "alt": "Descriptive alt text"
    }
  ]
}

## CONTENT STRUCTURE:

### 1. Opening Hook (Personal)
Start with a personal story or insight:
"After helping [X] patients with [procedure], here's what I wish everyone knew before flying to Korea..."

### 2. TL;DR Box
\`\`\`html
<div class="tldr-box">
  <h3>⚡ My Quick Take</h3>
  <ul>
    <li><strong>Real Cost:</strong> $X - $X (I've negotiated rates for my patients)</li>
    <li><strong>My Recommendation:</strong> Stay X days - here's why</li>
    <li><strong>Who It's Best For:</strong> Based on patients I've helped</li>
    <li><strong>Insider Tip:</strong> Something only a coordinator would know</li>
  </ul>
</div>
\`\`\`

### 3. Personal Experience Sections
Include throughout:
- "In my X years of experience..."
- "What I tell my patients is..."
- "One thing that surprised me when I first started..."
- "A common mistake I see..."

### 4. Honest Highlight & Warning Boxes
\`\`\`html
<div class="highlight-box">
  <h4>💡 Insider Tip from Sophia</h4>
  <p>Here's something most blogs won't tell you: [honest insider advice]</p>
</div>

<div class="warning-box">
  <h4>⚠️ Real Talk</h4>
  <p>I have to be honest about this: [realistic challenge or concern]</p>
</div>
\`\`\`

### 5. Comparison Table with Commentary
Add a personal note after the table explaining the numbers.

### 6. FAQ - Questions I Actually Get Asked
Use real conversational questions like:
- "Will it hurt? Be honest."
- "What if something goes wrong?"
- "How do I know which clinic to trust?"

### 7. Closing CTA (Personal & Warm)
End with a genuine invitation:
"If you're considering [procedure] in Korea, I'd love to help you navigate this journey. Every patient's situation is different, and I'm here to give you honest, personalized advice - not just a sales pitch. Send me a message anytime!"

### 8. Images (5 REQUIRED)
Realistic stock photo prompts showing:
- Warm consultation moments
- Modern clinic interiors with natural light
- Recovery room comfort
- Before/after consultation
- Patient-coordinator interaction

## CONTENT LENGTH: 1800-2500 words

## ABSOLUTELY FORBIDDEN:
- Generic corporate language ("We are committed to excellence...")
- Third person perspective
- Overly salesy or pushy tone
- Empty promises without honesty about challenges
- Medical jargon without explanation
- Content that sounds AI-generated or templated`;

  const userPrompt = `Write a personal blog post about "${keyword}" as Sophia Chen.

REMEMBER: You are Sophia, writing YOUR blog. Be authentic, warm, and genuinely helpful.

Your article should include:
1. Personal opening hook - share why this topic matters to you
2. "My Quick Take" TL;DR box with your honest assessment
3. Real patient stories (anonymized) - "Last month, I helped a patient from..."
4. Cost breakdown from YOUR experience negotiating with clinics
5. Honest comparison table with YOUR commentary
6. "Insider Tips from Sophia" boxes - things only a coordinator would know
7. "Real Talk" warning boxes - honest challenges patients should know
8. Step-by-step guide based on how YOU actually coordinate patients
9. Recovery tips YOU give to every patient
10. FAQs from questions YOUR patients actually ask
11. Warm, personal closing inviting readers to reach out to YOU
12. 5 realistic clinic/consultation image prompts

KEY TONE REQUIREMENTS:
- Write like you're emailing a friend who asked for advice
- Include at least 3 "In my experience..." or "What I tell patients..." phrases
- Be honest about challenges, not just benefits
- Sound like a real person with opinions, not a generic article
- End with a genuine invitation to connect

Make readers feel like they found a trustworthy insider who actually cares about helping them.`;

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
      const modelName = useImagen4 ? 'Google Imagen 4' : 'DALL-E 3';
      console.log(`\n🎨 Generating ${content.images.length} images with ${modelName}...`);
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

    const imageCost = generatedImages.length * (useImagen4 ? 0.03 : 0.08); // Imagen 4: ~$0.03, DALL-E HD: $0.08
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
