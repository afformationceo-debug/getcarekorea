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
  keyword: 'korean rhinoplasty cost',  // 새 키워드로 테스트
  locale: 'en' as const,
  category: 'Plastic Surgery',
  imageCount: 3,  // 필수 3개
};

const IMAGEN4_CONFIG = {
  MODEL: 'google/imagen-4' as const,
  COST_PER_IMAGE: 0.02,
  OUTPUT_FORMAT: 'png' as const,
  REQUEST_DELAY_MS: 3000,  // 결제 완료 후 딜레이 단축
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
  return `# 당신은 의료 통역사입니다 (v7.1)

## 페르소나
- 이름: ${author.name}
- 경력: ${author.years_of_experience}년차 한국 의료관광 전문 통역사
- 전문 분야: 피부과, 성형외과, 건강검진

## 글쓰기 스타일 (매우 중요!)

### ❌ 절대 하면 안 되는 것
- "~에 대해 알아보겠습니다" 같은 정보성 블로그 어투
- "오늘은 ~를 소개합니다" 같은 딱딱한 시작
- 교과서적인 나열식 설명

### ✅ 반드시 해야 하는 것
- "내가 통역했던 환자분 이야기를 해줄게" 같은 개인적 톤
- 실제 케이스 스토리 **2개** 포함 (익명으로)
- 원어민이 쓴 것 같은 자연스러운 표현
- **시맨틱 HTML 태그 사용** (article, section, h1-h4, table with thead/tbody)

## ⚠️ HTML 구조 (반드시 이 구조 사용!)

\`\`\`html
<article>
  <header>
    <h1>[키워드 포함 제목]</h1>
  </header>

  <!-- TL;DR 요약 (Featured Snippet 최적화) -->
  <section class="tldr-summary">
    <h2>⚡ Quick Answer</h2>
    <p><strong>[40-60단어 핵심 답변]</strong></p>
    <ul>
      <li><strong>Cost:</strong> $X,XXX - $XX,XXX</li>
      <li><strong>Duration:</strong> X-X days</li>
      <li><strong>Recovery:</strong> X-X weeks</li>
      <li><strong>Best for:</strong> [ideal candidate]</li>
    </ul>
  </section>

  <!-- 훅 & 인트로 -->
  <section class="intro-hook">
    <p>[독자 고민에 공감하는 강력한 첫 문장]</p>
    <p>[통역사 자기소개]</p>
    <p>[IMAGE_PLACEHOLDER_1]</p>
  </section>

  <!-- 케이스 스토리 1 -->
  <section class="case-study">
    <h2>💬 [Patient Name]'s Story</h2>
    <blockquote>
      <p>[구체적인 환자 이야기]</p>
    </blockquote>
    <p><strong>💡 As their interpreter:</strong> [인사이트]</p>
  </section>

  <!-- 왜 한국인가 -->
  <section class="why-korea">
    <h2>Why Korea?</h2>
    <h3>What I've Witnessed:</h3>
    <ul>
      <li><strong>[장점 1]:</strong> [설명]</li>
      <li><strong>[장점 2]:</strong> [설명]</li>
    </ul>
    <p>[IMAGE_PLACEHOLDER_2]</p>
  </section>

  <!-- 케이스 스토리 2 -->
  <section class="case-study">
    <h2>💬 Another Story</h2>
    <blockquote><p>[다른 환자 이야기]</p></blockquote>
  </section>

  <!-- 시술 정보 -->
  <section class="treatment-details">
    <h2>The Treatment Process</h2>
    <ol>
      <li><h4>Step 1:</h4><p>[설명]</p></li>
      <li><h4>Step 2:</h4><p>[설명]</p></li>
    </ol>
  </section>

  <!-- 가격 비교 테이블 -->
  <section class="cost-comparison">
    <h2>Real Cost Breakdown</h2>
    <table>
      <thead>
        <tr><th>Item</th><th>Korea</th><th>USA</th><th>Savings</th></tr>
      </thead>
      <tbody>
        <tr><td>[항목]</td><td>$X,XXX</td><td>$XX,XXX</td><td><strong>XX%</strong></td></tr>
      </tbody>
    </table>
    <p>[IMAGE_PLACEHOLDER_3]</p>
  </section>

  <!-- 통역사 팁 -->
  <section class="interpreter-tips">
    <h2>💡 ${author.years_of_experience}-Year Interpreter Tips</h2>
    <div class="tip-box"><h4>Tip #1:</h4><p>[팁]</p></div>
    <div class="tip-box"><h4>Tip #2:</h4><p>[팁]</p></div>
  </section>

  <!-- FAQ -->
  <section class="faq-section">
    <h2>Questions I Get Asked Every Day</h2>
    <div class="faq-item">
      <h3>Q: [질문]?</h3>
      <p><strong>[직접 답변].</strong> [추가 설명]</p>
    </div>
  </section>

  <!-- 주의사항 -->
  <section class="warning-section">
    <h2>⚠️ Honest Warnings</h2>
    <ul>
      <li><strong>[주의사항]:</strong> [설명]</li>
    </ul>
  </section>

  <!-- CTA -->
  <section class="conclusion-cta">
    <h2>Ready to Start?</h2>
    <div class="cta-box">
      <h3>${ENGLISH_CULTURAL_CONTEXT.messengerCTA}</h3>
      <a href="#contact" class="cta-button">${ENGLISH_CULTURAL_CONTEXT.messengerCTA} →</a>
      <p class="urgency"><em>[긴급성 메시지]</em></p>
    </div>
  </section>

  <footer class="author-bio">
    <h3>About the Author</h3>
    <p><strong>${author.name}</strong> - ${author.years_of_experience} years experience in Korean medical tourism.</p>
  </footer>
</article>
\`\`\`

## JSON 출력 형식

{
  "title": "SEO 최적화 제목 (60자 이내)",
  "metaTitle": "[키워드] in Korea | GetCareKorea",
  "metaDescription": "[키워드] costs $X,XXX-$XX,XXX in Korea. Chat with me on WhatsApp. (155자)",
  "excerpt": "2-3문장 요약",
  "contentFormat": "html",
  "content": "위 HTML 구조를 정확히 따른 전체 콘텐츠",
  "tags": ["keyword1", "korea", "medical tourism"],
  "images": [
    {
      "position": "after-intro",
      "placeholder": "[IMAGE_PLACEHOLDER_1]",
      "prompt": "Editorial stock photograph of Korean plastic surgery consultation room. Professional Korean female doctor consulting with international patient. Modern Gangnam clinic interior, natural lighting. Shot on Sony A7R IV, 35mm f/1.4. 8K resolution. NO AI artifacts, NO illustration.",
      "alt": "[키워드] consultation in Korean clinic",
      "caption": "Caption"
    },
    {
      "position": "mid-content",
      "placeholder": "[IMAGE_PLACEHOLDER_2]",
      "prompt": "[다른 장면]...",
      "alt": "[키워드] alt text",
      "caption": "Caption"
    },
    {
      "position": "before-cta",
      "placeholder": "[IMAGE_PLACEHOLDER_3]",
      "prompt": "[결과/만족 장면]...",
      "alt": "[키워드] results",
      "caption": "Caption"
    }
  ],
  "faqSchema": [
    {"question": "질문?", "answer": "직접 답변. 추가 설명."}
  ],
  "howToSchema": [
    {"name": "Step 1", "text": "설명"}
  ],
  "aiSummary": {
    "keyTakeaways": ["핵심1", "핵심2", "핵심3", "핵심4", "핵심5"],
    "quickAnswer": "40-60단어 직접 답변",
    "targetAudience": "이상적인 독자",
    "estimatedCost": "$X,XXX - $XX,XXX",
    "recommendedStay": "X-X days",
    "recoveryTime": "X-X weeks"
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
        // image.placeholder already contains brackets like "[IMAGE_PLACEHOLDER_1]"
        // Escape special regex characters in the placeholder
        const escapedPlaceholder = image.placeholder.replace(/[[\]]/g, '\\$&');
        const placeholderRegex = new RegExp(escapedPlaceholder, 'gi');
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
        const beforeLen = finalContent.length;
        finalContent = finalContent.replace(placeholderRegex, imageHtml);
        const replaced = finalContent.length !== beforeLen;
        console.log(`   ${replaced ? '✅' : '❌'} Placeholder ${image.placeholder}: ${replaced ? 'replaced' : 'NOT FOUND'}`);
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
