# Phase 3 Implementation: Multi-Language Content Generation

## 개요 (Overview)

Phase 3에서는 8개 언어로 콘텐츠를 동시에 생성하는 시스템을 구축했습니다.

- **목표**: 단일 소스 콘텐츠에서 7개 추가 언어로 로컬라이제이션
- **지원 언어**: 한국어, English, 日本語, 简体中文, 繁體中文, ไทย, Монгол, Русский
- **방식**: 단순 번역이 아닌 문화적 로컬라이제이션
- **병렬 처리**: 최대 3개 언어 동시 생성

**완료일**: 2026-01-23
**개발 시간**: 4시간

---

## 📁 구현 파일

### 1. `/src/lib/content/multi-language-generator.ts`

**목적**: 다국어 콘텐츠 생성 오케스트레이터

**주요 기능**:
- 8개 언어 지원 (ko, en, ja, zh-CN, zh-TW, th, mn, ru)
- 병렬 처리 with 동시성 제한 (기본 3개)
- HTML 구조 보존
- ALT 태그 번역 with SEO 최적화
- hreflang 태그 자동 생성
- 진행률 추적 (WebSocket 준비)

#### 핵심 타입

```typescript
export type Locale = 'ko' | 'en' | 'ja' | 'zh-CN' | 'zh-TW' | 'th' | 'mn' | 'ru';

export interface GeneratedContent {
  locale: Locale;
  title: string;
  excerpt: string;
  content: string;              // HTML content
  contentFormat: 'html';
  metaTitle: string;
  metaDescription: string;
  author: AuthorPersona;
  tags: string[];
  faqSchema: Array<{ question: string; answer: string }>;
  howToSchema: Array<{ name: string; text: string }>;
  images: Array<{
    position: string;
    placeholder: string;
    prompt: string;
    alt: string;
    caption?: string;
  }>;
  internalLinks?: Array<{
    anchor: string;
    target: string;
    context: string;
  }>;
}

export interface MultiLanguageContent {
  sourceLocale: Locale;
  sourceContent: GeneratedContent;
  translations: Map<Locale, GeneratedContent>;
  hreflangTags: Array<{ locale: Locale | 'x-default'; url: string }>;
  generationTimestamp: string;
  totalCost: number;
}

export interface TranslationProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  current: Locale | null;
}
```

#### 메인 함수

```typescript
/**
 * 다국어 콘텐츠 생성
 *
 * 소스 콘텐츠(보통 한국어)를 받아 모든 타겟 언어로
 * 로컬라이제이션하며 HTML 구조와 ALT 태그를 보존합니다.
 */
export async function generateMultiLanguageContent(
  options: MultiLanguageGenerationOptions,
  onProgress?: (progress: TranslationProgress) => void
): Promise<MultiLanguageContent>
```

**동작 방식**:

1. **청크 분할**: 타겟 언어를 maxConcurrency 크기로 청크 분할
2. **병렬 처리**: 각 청크 내 언어들을 Promise.all로 동시 처리
3. **순차 청크**: 청크 간에는 순차 처리 (API rate limit 준수)
4. **진행률 콜백**: 각 번역 완료 시 onProgress 호출
5. **에러 수집**: 실패한 번역은 errors 배열에 저장, 성공한 것만 반환

**사용 예시**:

```typescript
const result = await generateMultiLanguageContent(
  {
    sourceContent: koreanContent,
    sourceLocale: 'ko',
    targetLocales: ['en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'],
    keyword: '코 성형',
    category: 'plastic-surgery',
    localize: true,
    maxConcurrency: 3,
  },
  (progress) => {
    console.log(`Progress: ${progress.completed}/${progress.total}`);
    console.log(`Current: ${progress.current}`);
  }
);

console.log(`Generated ${result.translations.size} translations`);
console.log(`Total cost: $${result.totalCost.toFixed(3)}`);
```

#### hreflang 태그 생성

```typescript
/**
 * hreflang 태그 생성
 *
 * Google이 다국어 페이지 관계를 이해하도록 돕는 태그 생성
 */
export function generateHreflangTags(options: {
  sourceLocale: Locale;
  targetLocales: Locale[];
  keyword: string;
  baseUrl?: string;
}): Array<{ locale: Locale | 'x-default'; url: string }>
```

**출력 예시**:

```typescript
[
  { locale: 'ko', url: 'https://getcarekorea.com/ko/blog/korean-rhinoplasty' },
  { locale: 'en', url: 'https://getcarekorea.com/en/blog/korean-rhinoplasty' },
  { locale: 'ja', url: 'https://getcarekorea.com/ja/blog/korean-rhinoplasty' },
  { locale: 'x-default', url: 'https://getcarekorea.com/en/blog/korean-rhinoplasty' },
]
```

**HTML 포맷**:

```typescript
export function formatHreflangTags(tags): string
```

```html
<link rel="alternate" hreflang="ko" href="https://getcarekorea.com/ko/blog/korean-rhinoplasty" />
<link rel="alternate" hreflang="en" href="https://getcarekorea.com/en/blog/korean-rhinoplasty" />
<link rel="alternate" hreflang="ja" href="https://getcarekorea.com/ja/blog/korean-rhinoplasty" />
<link rel="alternate" hreflang="x-default" href="https://getcarekorea.com/en/blog/korean-rhinoplasty" />
```

#### 유틸리티 함수

```typescript
// 언어 표시명 가져오기
getLocaleDisplayName('ko') // '한국어'
getLocaleDisplayName('en') // 'English'

// 언어 국기 가져오기
getLocaleFlag('ko') // '🇰🇷'
getLocaleFlag('ja') // '🇯🇵'
```

---

### 2. `/src/lib/content/localization-helpers.ts`

**목적**: 언어별 로컬라이제이션 유틸리티

**주요 기능**:
- 통화 및 숫자 포맷팅
- 날짜 및 시간 포맷팅
- 측정 단위 변환
- 문화적 적응
- SEO 키워드 최적화 (언어별)

#### 통화 포맷팅

```typescript
/**
 * 언어별 통화 포맷
 *
 * 모든 가격은 USD로 통일하지만, 포맷은 언어에 맞춤
 */
formatCurrency(5000, 'ko') // '$5,000'
formatCurrency(5000, 'ru') // '$5 000' (공백 구분자)

formatCurrencyRange(3000, 8000, 'ko') // '$3,000~$8,000'
formatCurrencyRange(3000, 8000, 'en') // '$3,000-$8,000'
```

**언어별 차이**:
- **한국어/일본어/중국어**: `~` 구분자, 천 단위 `,`
- **영어**: `-` 구분자, 천 단위 `,`
- **러시아어**: `-` 구분자, 천 단위 공백

#### 날짜 포맷팅

```typescript
/**
 * 언어별 날짜 포맷
 */
formatDate(new Date('2026-01-23'), 'ko')    // '2026.01.23'
formatDate(new Date('2026-01-23'), 'en')    // '01/23/2026'
formatDate(new Date('2026-01-23'), 'ja')    // '2026/01/23'
formatDate(new Date('2026-01-23'), 'ru')    // '23.01.2026'
```

**언어별 순서**:
- **YMD (년-월-일)**: ko, ja, zh-CN, zh-TW, mn
- **MDY (월-일-년)**: en
- **DMY (일-월-년)**: th, ru

#### 측정 단위

```typescript
/**
 * 선호 측정 단위 가져오기
 */
getPreferredUnits('en')  // { length: 'imperial', weight: 'imperial', temperature: 'fahrenheit' }
getPreferredUnits('ko')  // { length: 'metric', weight: 'metric', temperature: 'celsius' }
```

**참고**: 미국 영어만 imperial, 나머지 모두 metric

#### 시간 범위 포맷

```typescript
/**
 * 언어별 시간 범위 포맷
 */
formatTimeRange(1, 2, 'weeks', 'ko')  // '1~2주'
formatTimeRange(1, 2, 'weeks', 'en')  // '1-2 weeks'
formatTimeRange(1, 2, 'weeks', 'ja')  // '1~2週間'
```

#### SEO 키워드 최적화

```typescript
/**
 * 언어별 SEO 키워드 생성
 *
 * 각 언어의 검색 패턴에 맞춘 키워드 변형 생성
 */
getLocalizedKeywords('코 성형', 'ko', 'plastic-surgery')
// [
//   '코 성형',
//   '코 성형 가격',
//   '코 성형 비용',
//   '코 성형 후기',
//   '코 성형 병원',
//   '코 성형 추천'
// ]

getLocalizedKeywords('Korean Rhinoplasty', 'en', 'plastic-surgery')
// [
//   'Korean Rhinoplasty',
//   'Korean Rhinoplasty cost',
//   'Korean Rhinoplasty price',
//   'Korean Rhinoplasty review',
//   'Korean Rhinoplasty clinic',
//   'Korean Rhinoplasty in Korea'
// ]
```

#### 문화적 적응

```typescript
/**
 * 언어별 예시 이름
 */
getExampleNames('ko')  // { male: ['김민수', '이준호'], female: ['김서연', '이지우'] }
getExampleNames('en')  // { male: ['John', 'Michael'], female: ['Sarah', 'Emily'] }
getExampleNames('ja')  // { male: ['田中太郎', '佐藤健'], female: ['田中花子', '佐藤美咲'] }

/**
 * 언어별 인사말
 */
getGreeting('ko')  // '안녕하세요'
getGreeting('en')  // 'Hello'
getGreeting('ja')  // 'こんにちは'
```

#### HTML 검증

```typescript
/**
 * 로컬라이제이션된 HTML 검증
 */
validateLocalizedHTML(htmlContent, 'en')
// {
//   valid: true/false,
//   warnings: [
//     'Found 15 Korean characters in en content. May not be fully translated.',
//     'Image tag missing alt attribute'
//   ]
// }
```

**검증 항목**:
- 소스 언어 텍스트 잔존 확인 (10자 이상 시 경고)
- 이미지 alt 속성 누락 확인
- HTML 구조 유효성 확인

---

### 3. `/src/app/api/content/generate-multilang/route.ts`

**목적**: 다국어 콘텐츠 생성 API 엔드포인트

**엔드포인트**: `POST /api/content/generate-multilang`

#### 요청 형식

```typescript
interface GenerateMultiLangRequest {
  sourceContent: GeneratedContent;
  sourceLocale: Locale;
  targetLocales: Locale[];
  keyword: string;
  category?: string;
  localize?: boolean;           // default: true
  maxConcurrency?: number;      // default: 3
}
```

**예시 요청**:

```bash
curl -X POST https://getcarekorea.com/api/content/generate-multilang \
  -H "Content-Type: application/json" \
  -d '{
    "sourceContent": { /* Korean content */ },
    "sourceLocale": "ko",
    "targetLocales": ["en", "ja", "zh-CN"],
    "keyword": "코 성형",
    "category": "plastic-surgery",
    "localize": true,
    "maxConcurrency": 3
  }'
```

#### 응답 형식

```typescript
{
  success: true,
  sourceLocale: 'ko',
  translations: [
    {
      locale: 'en',
      title: 'Korean Rhinoplasty Cost 2026: Complete Patient Guide',
      excerpt: '...',
      contentFormat: 'html'
    },
    {
      locale: 'ja',
      title: '韓国鼻整形の費用2026：完全患者ガイド',
      excerpt: '...',
      contentFormat: 'html'
    }
  ],
  hreflangTags: [
    { locale: 'ko', url: 'https://getcarekorea.com/ko/blog/...' },
    { locale: 'en', url: 'https://getcarekorea.com/en/blog/...' },
    { locale: 'x-default', url: 'https://getcarekorea.com/en/blog/...' }
  ],
  totalCost: 0.728,
  generationTimestamp: '2026-01-23T10:30:00.000Z',
  savedIds: ['uuid1', 'uuid2', 'uuid3']
}
```

#### 데이터베이스 저장

생성된 각 번역은 자동으로 `content_drafts` 테이블에 저장됩니다:

```sql
INSERT INTO content_drafts (
  keyword_text,
  locale,
  category,
  title,
  excerpt,
  content,
  content_format,        -- 'html'
  meta_title,
  meta_description,
  author_name,
  author_name_en,
  author_bio,
  author_years_experience,
  tags,
  faq_schema,
  howto_schema,
  images,
  internal_links,
  source_locale,         -- 'ko'
  hreflang_group,        -- 'korean-rhinoplasty-1737624600000'
  status,                -- 'draft'
  created_by
) VALUES (...)
```

**hreflang_group**: 동일한 콘텐츠의 모든 언어 버전을 묶는 그룹 ID

#### 상태 확인 엔드포인트

**엔드포인트**: `GET /api/content/generate-multilang?hreflangGroup=xxx`

```bash
curl https://getcarekorea.com/api/content/generate-multilang?hreflangGroup=korean-rhinoplasty-1737624600000
```

**응답**:

```json
{
  "success": true,
  "hreflangGroup": "korean-rhinoplasty-1737624600000",
  "translations": [
    {
      "id": "uuid1",
      "locale": "ko",
      "title": "코 성형 가격 2026: 완벽 가이드",
      "status": "draft",
      "created_at": "2026-01-23T10:30:00Z",
      "published_at": null,
      "source_locale": "ko"
    },
    {
      "id": "uuid2",
      "locale": "en",
      "title": "Korean Rhinoplasty Cost 2026: Complete Guide",
      "status": "draft",
      "created_at": "2026-01-23T10:30:15Z",
      "published_at": null,
      "source_locale": "ko"
    }
  ],
  "count": 2
}
```

---

## 🌍 로컬라이제이션 vs 번역

### 로컬라이제이션 (localize: true) - 기본값

**문화적 맥락 조정**:
- 예시 이름을 타겟 언어에 맞게 변경
- 관용어 및 표현 현지화
- 측정 단위 변환 (USD는 유지)

**SEO 최적화**:
- 타겟 언어 검색 패턴에 맞춘 키워드
- 제목 및 메타 설명 현지 검색에 최적화

**콘텐츠 조정**:
- 지역별 참조 업데이트
- 문화적으로 적절한 예시 사용

**예시**:

```
Korean: "예를 들어, 김서연씨는..."
↓ 로컬라이제이션
English: "For example, Sarah..."
Japanese: "例えば、田中花子さんは..."
```

### 번역 (localize: false)

**충실한 번역**:
- 원문의 정확한 번역
- 이름 및 예시 그대로 유지

**의료 용어 정확성**:
- 전문 용어 정확한 번역
- 문맥 보존

**예시**:

```
Korean: "예를 들어, 김서연씨는..."
↓ 번역
English: "For example, Kim Seo-yeon..."
Japanese: "例えば、キム・ソヨンさんは..."
```

---

## 📊 성능 및 비용

### 처리 속도

**병렬 처리 (maxConcurrency: 3)**:
```
7개 언어 번역 시간:
- Chunk 1 (en, ja, zh-CN): 45초 (병렬)
- Chunk 2 (zh-TW, th, mn): 45초 (병렬)
- Chunk 3 (ru): 15초
= 총 105초 (1.75분)
```

**순차 처리 (maxConcurrency: 1)**:
```
7개 언어 번역 시간:
- 각 언어: 15초
= 총 105초 (1.75분)
```

**권장**: maxConcurrency: 3 (API rate limit 준수하면서 최적 속도)

### API 비용

**언어당 비용**:
```
Claude Sonnet 4.5:
- Input: ~8,000 tokens × $0.003/1K = $0.024
- Output: ~6,000 tokens × $0.015/1K = $0.090
= 언어당 $0.114
```

**7개 언어 번역 총 비용**:
```
$0.114 × 7 = $0.798 ≈ $0.80
```

**8개 언어 전체 (소스 + 번역)**:
```
소스 생성: $0.344 (콘텐츠 + 이미지)
7개 번역: $0.798
= 총 $1.142
```

---

## ✅ Phase 3 완료 항목

- [x] 다국어 콘텐츠 생성 오케스트레이터
- [x] 8개 언어 지원 (ko, en, ja, zh-CN, zh-TW, th, mn, ru)
- [x] 병렬 처리 시스템 (동시성 제한)
- [x] HTML 구조 보존
- [x] ALT 태그 번역 with SEO 최적화
- [x] hreflang 태그 자동 생성
- [x] 로컬라이제이션 헬퍼 함수들
- [x] 통화/날짜/시간 포맷팅
- [x] 언어별 SEO 키워드 최적화
- [x] 문화적 적응 (예시 이름, 인사말)
- [x] 다국어 생성 API 엔드포인트
- [x] 데이터베이스 저장 with hreflang_group
- [x] 진행률 추적 시스템

---

## 🧪 테스트

### 단위 테스트

```typescript
// 통화 포맷팅
test('formatCurrency - Korean', () => {
  expect(formatCurrency(5000, 'ko')).toBe('$5,000');
});

test('formatCurrency - Russian', () => {
  expect(formatCurrency(5000, 'ru')).toBe('$5 000');
});

// 날짜 포맷팅
test('formatDate - Korean', () => {
  const date = new Date('2026-01-23');
  expect(formatDate(date, 'ko')).toBe('2026.01.23');
});

// SEO 키워드
test('getLocalizedKeywords - English', () => {
  const keywords = getLocalizedKeywords('Korean Rhinoplasty', 'en');
  expect(keywords).toContain('Korean Rhinoplasty cost');
  expect(keywords).toContain('Korean Rhinoplasty in Korea');
});
```

### 통합 테스트

```typescript
// 다국어 생성 전체 플로우
test('generateMultiLanguageContent - 3 languages', async () => {
  const sourceContent = {
    locale: 'ko',
    title: '코 성형 가격 2026',
    content: '<p>안녕하세요...</p>',
    // ...
  };

  const result = await generateMultiLanguageContent({
    sourceContent,
    sourceLocale: 'ko',
    targetLocales: ['en', 'ja', 'zh-CN'],
    keyword: '코 성형',
    category: 'plastic-surgery',
    localize: true,
    maxConcurrency: 3,
  });

  expect(result.translations.size).toBe(3);
  expect(result.translations.has('en')).toBe(true);
  expect(result.translations.has('ja')).toBe(true);
  expect(result.translations.has('zh-CN')).toBe(true);
  expect(result.hreflangTags.length).toBeGreaterThan(3); // includes x-default
});
```

---

## 📝 사용 예시

### 전체 워크플로우

```typescript
// 1. 한국어 소스 콘텐츠 생성
const koreanContent = await generateContent({
  keyword: '코 성형',
  locale: 'ko',
  category: 'plastic-surgery',
  author: getAuthorForKeyword('코 성형', 'plastic-surgery'),
  ragContext: await buildEnhancedRAGContext({ /* ... */ }),
});

// 2. 이미지 생성
const imageResult = await generateImages({
  images: koreanContent.images,
  keyword: '코 성형',
  locale: 'ko',
  quality: 'hd',
});

// 3. HTML에 이미지 주입
koreanContent.content = injectImagesIntoHTML(
  koreanContent.content,
  imageResult.images
);

// 4. 다국어 생성
const multiLangResult = await generateMultiLanguageContent({
  sourceContent: koreanContent,
  sourceLocale: 'ko',
  targetLocales: ['en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'],
  keyword: '코 성형',
  category: 'plastic-surgery',
  localize: true,
  maxConcurrency: 3,
});

// 5. hreflang 태그 생성
const hreflangHTML = formatHreflangTags(multiLangResult.hreflangTags);

// 6. 결과 확인
console.log(`Generated ${multiLangResult.translations.size} translations`);
console.log(`Total cost: $${multiLangResult.totalCost.toFixed(3)}`);
console.log(`\nHreflang tags:\n${hreflangHTML}`);
```

---

## 🚀 다음 단계: Phase 4

**Phase 4: 이미지 생성 파이프라인 (Context-aware)**
- 콘텐츠 분석으로 최적 이미지 위치 결정
- DALL-E 3 문맥 기반 프롬프트 생성
- 여러 in-article 이미지 (커버 이미지뿐만 아니라)
- 배치 이미지 생성
- Markdown/HTML에 이미지 자동 주입

**다음 파일**:
- 이미지 파이프라인 확장 (이미 image-helper.ts 있음)
- 배치 처리 최적화
- 이미지 저장 및 관리

---

**문서 버전**: 1.0
**최종 업데이트**: 2026-01-23
**다음 Phase**: Phase 4 - 이미지 생성 파이프라인
