/**
 * Test Script: Generate Interpreter Persona Content (v7)
 *
 * ⚠️ CRITICAL: 통역사 페르소나 기반 후기형 콘텐츠 생성
 * - v7 프롬프트 사용 (NOT v6 정보성 블로그)
 * - 실제 케이스 스토리 포함
 * - 현지인 감성 100% 반영
 * - 설득 플로우: 공감 → 문제인식 → 해결책 → 증거 → CTA
 *
 * Usage: npx tsx scripts/generate-interpreter-persona-content.ts
 */

// ⚠️ Load env FIRST before any other imports
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Now import modules
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Replicate from 'replicate';

// =====================================================
// CLIENTS
// =====================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// =====================================================
// CONFIGURATION
// =====================================================

const TEST_CONFIG = {
  keyword: 'rejuran healer korea',
  locale: 'en' as const,
  category: 'Dermatology',
  imageCount: 3,
};

const IMAGEN4_CONFIG = {
  MODEL: 'google/imagen-4' as const,
  COST_PER_IMAGE: 0.02,
  OUTPUT_FORMAT: 'png' as const,
  REQUEST_DELAY_MS: 12000,
};

// =====================================================
// CULTURAL CONTEXT (from v7 prompt)
// =====================================================

const ENGLISH_CULTURAL_CONTEXT = {
  name: 'English',
  nativeName: 'English',
  painPoints: [
    'Healthcare costs in the US/UK are insane',
    'Long wait times for elective procedures',
    'Insurance nightmare',
    'Quality concerns with cheaper alternatives',
  ],
  values: ['Efficiency', 'Value for money', 'Transparency', 'Reviews and testimonials'],
  trustSignals: ['Before/after photos', 'Specific numbers/stats', 'Professional credentials', 'Patient testimonials'],
  communicationStyle: 'Direct, facts-first, logical flow with emotional story',
  messenger: 'WhatsApp',
  messengerCTA: 'Chat with me on WhatsApp',
  greeting: 'Hey there',
  emotionalTone: 'Warm but professional, like a knowledgeable friend',
};

// =====================================================
// V7 INTERPRETER PERSONA PROMPT
// =====================================================

function buildInterpreterSystemPrompt(author: { name: string; years_of_experience: number }) {
  return `# 당신은 의료 통역사입니다

## 페르소나
- 이름: ${author.name}
- 경력: ${author.years_of_experience}년차 한국 의료관광 전문 통역사
- 전문 분야: 피부과, 성형외과, 건강검진

## 글쓰기 스타일 (매우 중요!)

### ❌ 절대 하면 안 되는 것
- "~에 대해 알아보겠습니다" 같은 정보성 블로그 어투
- "오늘은 ~를 소개합니다" 같은 딱딱한 시작
- 교과서적인 나열식 설명
- 일반적인 SEO 블로그 스타일

### ✅ 반드시 해야 하는 것
- "내가 통역했던 환자분 이야기를 해줄게" 같은 개인적 톤
- 실제 케이스 스토리 1-2개 포함 (익명으로)
- 통역 현장에서 느낀 솔직한 감정과 인사이트
- 원어민이 쓴 것 같은 자연스러운 표현
- "나"를 주어로 자주 사용

## 설득 플로우 (이 순서대로 작성)

1. **훅 (Hook)** - 독자 고민에 공감하는 질문이나 스토리로 시작
   - "Have you ever wondered..." 또는 실제 환자 에피소드

2. **자기소개** - 왜 내 말을 들어야 하는지
   - 통역사로서의 경험, 수백 명의 환자를 봐온 이야기

3. **실제 케이스 스토리** - 익명의 환자 이야기 1-2개
   - 구체적인 상황, 그들의 고민, 결과
   - 감정적 연결 형성

4. **왜 한국인가** - 통역사 관점에서
   - 직접 본 한국 의료진의 실력
   - 시설, 가격 대비 퀄리티

5. **구체적 정보** - 독자가 궁금해할 것들
   - 시술 과정, 가격대, 소요 시간, 회복 기간

6. **FAQ** - 통역사 톤으로
   - "이건 환자분들이 제일 많이 물어보는 건데요..."

7. **CTA** - 문의로 이어지게
   - "${ENGLISH_CULTURAL_CONTEXT.messengerCTA}"

## 타겟 독자 이해

**그들의 고민:**
${ENGLISH_CULTURAL_CONTEXT.painPoints.map(p => `- ${p}`).join('\n')}

**그들이 중요하게 여기는 것:**
${ENGLISH_CULTURAL_CONTEXT.values.map(v => `- ${v}`).join('\n')}

**신뢰 시그널:**
${ENGLISH_CULTURAL_CONTEXT.trustSignals.map(t => `- ${t}`).join('\n')}

## 출력 형식

JSON으로만 출력하세요:

{
  "title": "통역사 관점의 후기성 제목 (60-70자)",
  "metaTitle": "SEO 메타 타이틀 (55-60자)",
  "metaDescription": "CTA 포함 메타 설명 (150-160자)",
  "excerpt": "2-3문장 요약",
  "contentFormat": "html",
  "content": "<article>HTML 콘텐츠</article>",
  "tags": ["tag1", "tag2", ...],
  "images": [
    {
      "position": "after-hook",
      "placeholder": "IMAGE_PLACEHOLDER_1",
      "prompt": "Ultra-realistic professional photograph, [구체적 장면 설명]. Shot with Sony A7R IV, 35mm f/1.4 lens. Natural lighting, 8K resolution, sharp focus. NO AI artifacts, NO illustration, NO cartoon.",
      "alt": "SEO 최적화된 alt 텍스트",
      "caption": "이미지 캡션 (선택)"
    }
  ],
  "faqSchema": [
    {"question": "Q", "answer": "A (통역사 톤으로)"}
  ],
  "howToSchema": [
    {"name": "Step name", "text": "Step description"}
  ],
  "aiSummary": {
    "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
    "quickAnswer": "40-60단어 직접 답변",
    "targetAudience": "이상적인 독자",
    "estimatedCost": "비용 범위 USD",
    "recommendedStay": "권장 체류 기간",
    "recoveryTime": "회복 기간"
  }
}`;
}

// =====================================================
// IMAGE GENERATION
// =====================================================

interface ImagePrompt {
  position: string;
  placeholder: string;
  prompt: string;
  alt: string;
  caption?: string;
}

async function generateImageWithImagen4(
  imagePrompt: ImagePrompt
): Promise<{ url: string; alt: string; placeholder: string } | null> {
  console.log(`   📷 Generating: ${imagePrompt.position}...`);

  const enhancedPrompt = `Ultra-realistic professional photograph, ${imagePrompt.prompt}. Setting: Premium Korean medical clinic in Seoul's Gangnam district. Style: Editorial documentary photography, natural lighting, professional atmosphere. Technical: 8K resolution, sharp focus, natural colors. NO AI artifacts, NO illustration, NO cartoon, NO text overlay.`;

  try {
    const output = await replicate.run(IMAGEN4_CONFIG.MODEL, {
      input: {
        prompt: enhancedPrompt,
        aspect_ratio: '16:9',
        output_format: IMAGEN4_CONFIG.OUTPUT_FORMAT,
        negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text overlay, cartoon, anime, illustration, 3d render, CGI, AI generated look',
      },
    });

    const imageUrl = typeof output === 'string' ? output :
                     Array.isArray(output) ? String(output[0]) :
                     String(output);

    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.log(`   ❌ Invalid URL returned`);
      return null;
    }

    console.log(`   ✅ Generated: ${imagePrompt.position}`);
    return {
      url: imageUrl,
      alt: imagePrompt.alt,
      placeholder: imagePrompt.placeholder,
    };
  } catch (error: any) {
    console.error(`   ❌ Error generating ${imagePrompt.position}:`, error.message || error);
    return null;
  }
}

// =====================================================
// MAIN GENERATION
// =====================================================

async function generateInterpreterContent() {
  console.log('\n🚀 통역사 페르소나 콘텐츠 생성 (v7)');
  console.log('='.repeat(60));
  console.log(`키워드: ${TEST_CONFIG.keyword}`);
  console.log(`언어: ${TEST_CONFIG.locale}`);
  console.log(`카테고리: ${TEST_CONFIG.category}`);
  console.log(`이미지: ${TEST_CONFIG.imageCount}개`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  // Author persona
  const author = {
    name: '이민준',
    years_of_experience: 7,
  };

  try {
    // Step 1: Generate content with interpreter persona
    console.log('\n📝 Step 1: 통역사 페르소나 콘텐츠 생성 중...');
    console.log('   ⚠️ v7 프롬프트 사용 (후기/에세이 스타일)');
    console.log(`   👤 저자: ${author.name} (${author.years_of_experience}년 경력)`);

    const systemPrompt = buildInterpreterSystemPrompt(author);

    const userPrompt = `키워드: "${TEST_CONFIG.keyword}"

## 당신의 임무

당신은 ${author.years_of_experience}년차 의료 통역사입니다.
이 키워드에 대해 **후기/에세이 스타일**로 글을 써주세요.

## 핵심 요구사항

### 1. 글쓰기 스타일
- ❌ "Let me tell you about..." 같은 정보성 블로그 어투 금지
- ✅ "I'll never forget this one patient..." 같은 개인적 스토리
- ✅ 실제 케이스 스토리 2개 반드시 포함 (익명)
- ✅ 영어 원어민이 쓴 것 같은 자연스러운 표현

### 2. 독자 타겟: 영어권 사용자
그들의 고민: ${ENGLISH_CULTURAL_CONTEXT.painPoints.slice(0, 2).join(', ')}
그들이 중요하게 여기는 것: ${ENGLISH_CULTURAL_CONTEXT.values.slice(0, 2).join(', ')}
커뮤니케이션 스타일: ${ENGLISH_CULTURAL_CONTEXT.communicationStyle}

### 3. 설득 플로우 (이 순서대로)
1. 훅 - 독자 고민에 공감하는 질문/스토리로 시작
2. 자기소개 - 통역사로서의 경험
3. 실제 케이스 스토리 2개
4. 왜 한국인가 (통역사 관점)
5. 구체적 정보 (가격, 기간, 과정)
6. FAQ (통역사 톤으로)
7. CTA - "${ENGLISH_CULTURAL_CONTEXT.messengerCTA}"

### 4. 이미지
- ${TEST_CONFIG.imageCount}개의 스톡포토 스타일 이미지
- 카메라 스펙 명시 (Sony A7R IV, 35mm f/1.4)
- "NO AI artifacts, NO illustration" 필수

### 5. 분량
- 최소 2000 단어
- 깊이 있는 정보와 개인적 경험 포함

### 6. 목표
글을 읽은 사람이 "이 통역사에게 연락해봐야겠다"고 느끼게 만들기

## 출력 형식
- JSON만 출력 (마크다운이나 설명 없이)
- { 로 시작해서 } 로 끝
- system prompt의 JSON 구조 정확히 따르기

이제 영어로 통역사 후기 스타일의 글을 작성해주세요.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    console.log(`   ✅ Claude 응답 수신`);
    console.log(`   📊 토큰 - 입력: ${response.usage.input_tokens}, 출력: ${response.usage.output_tokens}`);

    // Parse JSON
    let jsonStr = contentBlock.text.trim();

    // Try to extract JSON
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    if (!jsonStr.startsWith('{')) {
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
    }

    const blogData = JSON.parse(jsonStr);

    console.log(`\n   📄 제목: ${blogData.title}`);
    console.log(`   📸 이미지 프롬프트: ${blogData.images?.length || 0}개`);

    // Calculate content cost
    const contentCost = (response.usage.input_tokens / 1000) * 0.003 +
                       (response.usage.output_tokens / 1000) * 0.015;

    // Step 2: Generate images with Imagen 4
    let finalContent = blogData.content;
    const generatedImages: Array<{ url: string; alt: string; placeholder: string }> = [];
    let imageCost = 0;

    if (blogData.images && blogData.images.length > 0) {
      console.log('\n🎨 Step 2: Imagen 4로 이미지 생성 중...');

      const imagesToGenerate = blogData.images.slice(0, TEST_CONFIG.imageCount);
      console.log(`   생성할 이미지: ${imagesToGenerate.length}개`);

      for (let i = 0; i < imagesToGenerate.length; i++) {
        const img = imagesToGenerate[i];
        const result = await generateImageWithImagen4(img);
        if (result) {
          generatedImages.push(result);
          imageCost += IMAGEN4_CONFIG.COST_PER_IMAGE;
        }
        // Rate limit delay
        if (i < imagesToGenerate.length - 1) {
          console.log(`   ⏳ Rate limit 대기 (${IMAGEN4_CONFIG.REQUEST_DELAY_MS / 1000}s)...`);
          await new Promise(resolve => setTimeout(resolve, IMAGEN4_CONFIG.REQUEST_DELAY_MS));
        }
      }

      console.log(`\n   ✅ ${generatedImages.length}개 이미지 생성 완료`);

      // Inject images into content
      for (const image of generatedImages) {
        const placeholderRegex = new RegExp(`\\[${image.placeholder}\\]`, 'gi');
        const imageHtml = `
<figure class="my-8">
  <img
    src="${image.url}"
    alt="${image.alt}"
    class="w-full rounded-lg shadow-lg"
    loading="lazy"
    width="1792"
    height="1024"
  />
</figure>`;
        finalContent = finalContent.replace(placeholderRegex, imageHtml);
      }
    }

    // Step 3: Save to database
    console.log('\n💾 Step 3: 데이터베이스에 저장 중...');

    const slug = TEST_CONFIG.keyword.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36);

    const { data: post, error: saveError } = await supabase
      .from('blog_posts')
      .insert({
        slug,
        title_en: blogData.title,
        content_en: finalContent,
        excerpt_en: blogData.excerpt,
        meta_title_en: blogData.metaTitle,
        meta_description_en: blogData.metaDescription,
        category: TEST_CONFIG.category,
        tags: blogData.tags || [],
        generation_metadata: {
          keyword: TEST_CONFIG.keyword,
          locale: TEST_CONFIG.locale,
          model: 'claude-sonnet-4',
          prompt_version: 'v7-interpreter-persona',
          image_model: IMAGEN4_CONFIG.MODEL,
          faq_schema: blogData.faqSchema,
          howto_schema: blogData.howToSchema,
          ai_summary: blogData.aiSummary,
          generated_images: generatedImages,
          content_cost: contentCost,
          image_cost: imageCost,
          generated_at: new Date().toISOString(),
        },
        status: 'published',
        author_id: null,
        view_count: 0,
      })
      .select()
      .single();

    if (saveError) {
      console.error('   ❌ 저장 실패:', saveError.message);
      throw saveError;
    }

    console.log(`   ✅ 저장 완료! ID: ${post.id}`);
    console.log(`   📝 Slug: ${slug}`);

    // Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalCost = contentCost + imageCost;

    console.log('\n' + '='.repeat(60));
    console.log('✅ 통역사 페르소나 콘텐츠 생성 완료!');
    console.log('='.repeat(60));
    console.log(`\n📊 요약:`);
    console.log(`   총 시간: ${totalTime}s`);
    console.log(`   콘텐츠 비용: $${contentCost.toFixed(4)}`);
    console.log(`   이미지 비용: $${imageCost.toFixed(4)}`);
    console.log(`   총 비용: $${totalCost.toFixed(4)}`);
    console.log(`   이미지 생성: ${generatedImages.length}개`);

    console.log(`\n🔗 게시된 URL:`);
    console.log(`   Production: https://getcarekorea.com/en/blog/${slug}`);
    console.log(`   Local: http://localhost:3002/en/blog/${slug}`);

    console.log(`\n⚠️  확인 사항:`);
    console.log(`   1. 통역사 페르소나 스타일인지 확인`);
    console.log(`   2. 후기/에세이 톤인지 확인`);
    console.log(`   3. 실제 케이스 스토리가 포함되었는지 확인`);
    console.log(`   4. CTA가 문의로 이어지는지 확인`);

    return { slug, postId: post.id };

  } catch (error: any) {
    console.error('\n❌ 콘텐츠 생성 실패:', error.message || error);
    throw error;
  }
}

// Run
generateInterpreterContent()
  .then(result => {
    console.log(`\n✅ 완료! 게시물 확인:`);
    console.log(`   https://getcarekorea.com/en/blog/${result.slug}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
