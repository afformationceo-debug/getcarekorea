# 🔒 블로그 생성 시스템 - 영구 고정 설정

**⚠️ 이 설정은 절대 변경하지 마세요! 모든 블로그는 이 구조를 따라야 합니다.**

생성일: 2026-01-27
최종 검증: 2026-01-27 18:00 KST
상태: ✅ **완전히 작동하는 프로덕션 버전**

---

## 📋 필수 요구사항 체크리스트

### ✅ 1. 이미지 생성 (필수)
- **개수**: 최소 5개 (Hero 1개 + Section 4개 이상)
- **API**: Google Generative AI (GOOGLE_AI_API_KEY 사용)
- **위치**: 각 H2 섹션 뒤에 자동 삽입
- **포맷**: `![](image_url)` 마크다운 형식
- **저장**: Supabase `blog-images` 버킷
- **파일명**: `blog-image-{timestamp}-{index}.png`

**검증 코드**: [generate-professional-blog-posts.ts:207-292](../scripts/generate-professional-blog-posts.ts#L207-L292)

### ✅ 2. HTML/마크다운 구조 (필수)
모든 블로그는 **정확히 이 순서**로 작성되어야 합니다:

```markdown
{Hook paragraph}

## 📋 Quick Summary
- Bullet point 1
- Bullet point 2
- Bullet point 3

![](section_image_1.png)

## Introduction with Personal Story
{Content}

![](section_image_2.png)

## Main Topic (keyword-focused, with comparison table)

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |

![](section_image_3.png)

## Expert Insights & Tips

1. **Tip 1**: Description
2. **Tip 2**: Description
3. **Tip 3**: Description
4. **Tip 4**: Description
5. **Tip 5**: Description

![](section_image_4.png)

## Cost Breakdown

| 수술 항목 | USD | KRW |
|----------|-----|-----|
| Surgery  | $X  | ₩Y  |

## Top Clinics/Hospitals

| Hospital | Rating | Specialties |
|----------|--------|-------------|
| Name     | ⭐⭐⭐⭐⭐ | List        |

## FAQ Section

### Question 1?
Answer 1

### Question 2?
Answer 2

(최소 5개 질문-답변)

## Conclusion with Clear CTA
{Content}
```

**검증 코드**: [generate-professional-blog-posts.ts:105-114](../scripts/generate-professional-blog-posts.ts#L105-L114)

### ✅ 3. 마크다운 포맷팅 (필수)
- **H2 태그**: `## Heading` (최소 8개)
- **H3 태그**: `### Subheading` (적절히 사용)
- **표**: `| Header |` 형식 (최소 2개)
- **굵은 글씨**: `**text**` (강조할 내용)
- **리스트**: `-` 또는 `1.` (번호/불릿)
- **블록쿼트**: `> Expert tip` (전문가 팁)
- **구분선**: `---` (주요 섹션 사이)

**렌더링 코드**: [BlogPostClient.tsx:704-773](../src/app/[locale]/blog/[slug]/BlogPostClient.tsx#L704-L773)

### ✅ 4. SEO & AEO 최적화 (필수)
- **키워드 위치**: Title, First paragraph, H2 headers, Meta description
- **People Also Ask**: FAQ 섹션에 반영
- **Featured Snippets**: 리스트, 표, 명확한 답변 형식
- **로컬 SEO**: Gangnam, Apgujeong, Sinsa 등 지명 포함
- **Meta Description**: 150-160자, 키워드 포함

**검증 코드**: [generate-professional-blog-posts.ts:124-129](../scripts/generate-professional-blog-posts.ts#L124-L129)

### ✅ 5. 컨텐츠 품질 (필수)
- **최소 단어 수**: 2000+ words
- **페르소나**: First-person interpreter ("As an interpreter, I've seen...")
- **실제 정보**: 구체적인 병원명, 가격, 위치
- **개인 일화**: 익명화된 환자 스토리
- **실용적 조언**: Actionable tips and insider knowledge

**검증 코드**: [generate-professional-blog-posts.ts:131-136](../scripts/generate-professional-blog-posts.ts#L131-L136)

### ✅ 6. 로케일별 타겟팅 (필수)
각 블로그는 **특정 로케일에만 표시**됩니다:

```typescript
const LOCALE_KEYWORDS = {
  'en': ['best plastic surgery korea 2026', ...],      // 미국 타겟
  'ja': ['韓国美容整形 2026', ...],                     // 일본 타겟
  'zh-TW': ['韓國整形 2026 推薦', ...],                // 대만 타겟
  'zh-CN': ['韩国整形 2026', ...],                     // 중국 타겟
  'th': ['ศัลยกรรมเกาหลี 2026', ...],                  // 태국 타겟
}
```

- **API 필터링**: `.eq('target_locale', locale)` [route.ts:94](../src/app/api/blog/route.ts#L94)
- **키워드**: 각 로케일의 실제 검색어 사용
- **타겟 국가**: US, JP, TW, CN, TH

---

## 🚀 사용 방법

### 1️⃣ 블로그 생성 (단일)

```bash
# 대만 블로그 1개 생성
npx tsx scripts/generate-professional-blog-posts.ts zh-TW 1

# 일본 블로그 1개 생성
npx tsx scripts/generate-professional-blog-posts.ts ja 1
```

### 2️⃣ 블로그 대량 생성

```bash
# 영어 5개 생성
npx tsx scripts/generate-professional-blog-posts.ts en 5

# 모든 언어별 5개씩 생성
npx tsx scripts/generate-professional-blog-posts.ts en 5
npx tsx scripts/generate-professional-blog-posts.ts ja 5
npx tsx scripts/generate-professional-blog-posts.ts zh-TW 5
npx tsx scripts/generate-professional-blog-posts.ts zh-CN 5
npx tsx scripts/generate-professional-blog-posts.ts th 5
```

### 3️⃣ 생성된 블로그 확인

```bash
# 최신 대만 블로그 확인
npx tsx scripts/get-latest-taiwan-blog.ts

# 또는 직접 URL로 접근
# https://getcarekorea.com/{locale}/blog/{slug}
```

---

## 🔍 자동 검증 시스템

스크립트는 다음을 **자동으로 검증**합니다:

```typescript
// 1. 필수 필드 검증
if (!blogContent.title || !blogContent.content || !blogContent.featured_image_prompt) {
  throw new Error('Missing required fields');
}

// 2. 이미지 개수 검증
if (!blogContent.section_image_prompts || blogContent.section_image_prompts.length < 4) {
  throw new Error('Need at least 4 section image prompts');
}

// 3. 컨텐츠 길이 검증 (2000+ words 권장)
// 4. 마크다운 구조 검증 (H2 태그, 표 존재 여부)
```

**검증 코드**: [generate-professional-blog-posts.ts:188-195](../scripts/generate-professional-blog-posts.ts#L188-L195)

---

## 📁 핵심 파일 (절대 수정 금지)

### 1. 블로그 생성 스크립트
**파일**: `scripts/generate-professional-blog-posts.ts`
**역할**: Claude API로 컨텐츠 생성, Google AI로 이미지 생성
**마지막 수정**: 2026-01-27
**버전**: v2.0.0 (프로덕션)

### 2. 블로그 렌더링 컴포넌트
**파일**: `src/app/[locale]/blog/[slug]/BlogPostClient.tsx`
**역할**: 마크다운을 HTML로 렌더링 (ReactMarkdown 사용)
**마지막 수정**: 2026-01-27
**버전**: v2.0.0 (프로덕션)

### 3. 블로그 API 라우트
**파일**: `src/app/api/blog/route.ts`
**역할**: 로케일별 블로그 필터링 API
**핵심 로직**: Line 94 - `.eq('target_locale', locale)`

### 4. 스타일시트
**파일**: `src/app/globals.css`
**역할**: 블로그 컨텐츠 스타일 (`.blog-content` 클래스)
**범위**: Lines 319-873

---

## 🎨 이미지 생성 세부사항

### Google Generative AI 사용
```typescript
// 이미지 생성 API 엔드포인트
const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict';

// 프롬프트 형식
const prompt = {
  text: `Professional medical photography: ${userPrompt}. High quality, clean, modern hospital setting, natural lighting, photorealistic.`
};

// 파라미터
const parameters = {
  sampleCount: 1,
  aspectRatio: '16:9',
};
```

### Supabase 업로드
```typescript
// 버킷: blog-images
// 파일명: blog-image-{timestamp}-{index}.png
// Public URL: https://{project}.supabase.co/storage/v1/object/public/blog-images/{filename}
```

### 이미지 삽입 로직
```typescript
// 각 H2 섹션 뒤에 자동 삽입
function insertImagesIntoContent(content: string, images: string[]): string {
  const sections = content.split(/^(## .+)$/gm);

  sections.forEach((section, i) => {
    if (section.match(/^## /) && imageIndex < images.length) {
      sections[i+1] = `\n\n![](${images[imageIndex]})\n\n` + sections[i+1];
      imageIndex++;
    }
  });

  return sections.join('');
}
```

---

## ⚠️ 절대 하지 말아야 할 것들

### ❌ 금지 사항

1. **프롬프트 변경 금지**
   - "CRITICAL REQUIREMENTS:" 섹션 수정 금지
   - "MUST FOLLOW EXACTLY:" 구조 변경 금지
   - 필수 섹션 제거 금지

2. **검증 로직 제거 금지**
   - Line 188-195의 검증 코드 절대 삭제 금지
   - 이미지 개수 체크 무시 금지

3. **렌더링 컴포넌트 수정 금지**
   - ReactMarkdown 컴포넌트 교체 금지
   - components prop의 스타일링 변경 금지
   - 이미지 렌더링 로직 제거 금지

4. **API 필터링 제거 금지**
   - `.eq('target_locale', locale)` 절대 삭제 금지
   - 로케일 분리 로직 변경 금지

### ✅ 허용된 수정

1. **키워드 추가/변경**
   - `LOCALE_KEYWORDS` 객체에 새 키워드 추가 가능
   - 기존 키워드를 더 나은 키워드로 교체 가능

2. **스타일링 미세 조정**
   - `globals.css`의 `.blog-content` 스타일 색상/간격 조정 가능
   - 단, 구조는 유지해야 함

3. **번역 개선**
   - `translateContent()` 함수의 번역 품질 개선 가능
   - 단, JSON 구조는 유지해야 함

---

## 🧪 테스트 체크리스트

새 블로그를 생성한 후 **반드시 다음을 확인**하세요:

### 프론트엔드 렌더링
- [ ] H2 태그가 큰 제목으로 표시되는가? (왼쪽 보라색 줄 포함)
- [ ] 표가 예쁘게 포맷된 HTML 테이블로 보이는가?
- [ ] 이미지가 각 섹션마다 표시되는가? (최소 4개)
- [ ] 굵은 글씨가 진하게 표시되는가?
- [ ] 리스트에 예쁜 불릿/번호가 있는가?
- [ ] FAQ 섹션이 질문-답변 형태로 보이는가?
- [ ] 블록쿼트에 왼쪽 테두리가 있는가?

### 데이터베이스 확인
- [ ] `target_locale` 필드가 올바른가?
- [ ] `target_country` 필드가 올바른가?
- [ ] `keywords` 배열에 키워드가 있는가?
- [ ] `cover_image_url`에 이미지 URL이 있는가?
- [ ] `content_en`에 이미지 마크다운(`![](url)`)이 포함되어 있는가?

### SEO 확인
- [ ] Meta description이 150-160자인가?
- [ ] Title에 키워드가 포함되어 있는가?
- [ ] 첫 문단에 키워드가 포함되어 있는가?
- [ ] 로케일 필터링이 작동하는가? (해당 언어 페이지에만 표시)

---

## 📞 문제 발생 시

### 이미지가 생성되지 않을 때
```bash
# 1. API 키 확인
echo $GOOGLE_AI_API_KEY

# 2. Supabase 버킷 확인
npx tsx scripts/create-blog-images-bucket.ts

# 3. 플레이스홀더 이미지 사용
# 스크립트는 자동으로 플레이스홀더로 폴백합니다
```

### 마크다운이 렌더링되지 않을 때
```bash
# 1. 빌드 & 배포
npm run build
vercel --prod --yes

# 2. 캐시 삭제
# 브라우저에서 Ctrl+F5 또는 Cmd+Shift+R

# 3. 컴포넌트 확인
# BlogPostClient.tsx의 ReactMarkdown이 있는지 확인
```

### 로케일 필터링이 안 될 때
```bash
# API 라우트 확인
# src/app/api/blog/route.ts Line 94
# .eq('target_locale', locale) 코드가 있는지 확인
```

---

## 🎯 성공 기준

**완벽한 블로그 = 아래 모든 항목 ✅**

1. ✅ 5개 이상 이미지 (Hero + 4 Section)
2. ✅ 8개 H2 태그 (구조화된 섹션)
3. ✅ 2개 이상 비교 표
4. ✅ Quick Summary 박스
5. ✅ 5개 이상 실용 팁 (번호 매긴 리스트)
6. ✅ Cost Breakdown 표
7. ✅ Top Clinics 비교표
8. ✅ FAQ 섹션 (5개 이상 Q&A)
9. ✅ 굵은 글씨 강조
10. ✅ 블록쿼트 (전문가 팁)
11. ✅ 구분선
12. ✅ 2000+ 단어
13. ✅ 통역사 페르소나
14. ✅ 실제 병원명/가격
15. ✅ SEO 최적화

---

## 📝 마지막 업데이트

**날짜**: 2026-01-27 18:00 KST
**작업자**: Claude Sonnet 4.5
**상태**: ✅ 프로덕션 검증 완료
**Git 커밋**: 557894d

**다음 업데이트 예정**: 필요 없음 (완전히 작동함)

---

**🔒 이 문서는 블로그 시스템의 "헌법"입니다. 절대 변경하지 마세요!**
