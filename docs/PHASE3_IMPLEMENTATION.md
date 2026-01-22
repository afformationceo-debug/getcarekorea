# Phase 3: 프롬프트 고도화 & RAG 강화 - 구현 문서

> 완료일: 2026-01-22
> 버전: 3.0

---

## 1. 개요

Phase 3에서는 콘텐츠 생성 품질을 높이기 위한 프롬프트 시스템을 전면 개편했습니다.

### 1.1 주요 목표
- 7개 로케일별 SEO/문화적 맞춤 프롬프트
- 5개 의료 카테고리별 전문 프롬프트
- Google E-E-A-T 및 AEO 최적화
- 고성과 콘텐츠 기반 학습 RAG 시스템

### 1.2 콘텐츠 발행 정체성
> **중요**: 모든 자동 발행 콘텐츠는 **통역사** 또는 **플랫폼** 정체성으로 발행됩니다.
> - 의료 전문가가 아닌 의료 관광 가이드/코디네이터 관점
> - "저희 플랫폼에서...", "통역사로서 많은 환자분들을..." 등의 표현
> - 의료 조언이 아닌 정보 제공 및 안내 역할

---

## 2. 구현된 파일 구조

```
src/lib/content/
├── prompts/
│   ├── index.ts                 # 프롬프트 시스템 인덱스
│   ├── locale-prompts.ts        # 로케일별 심화 프롬프트
│   ├── category-prompts.ts      # 카테고리별 전문 프롬프트
│   ├── system-prompt.ts         # 시스템 프롬프트 v3.0
│   └── prompt-builder.ts        # 통합 프롬프트 빌더
├── learning-rag.ts              # 고성과 콘텐츠 학습 RAG
└── generator.ts                 # 기존 생성기 (업데이트 예정)
```

---

## 3. 로케일별 프롬프트 시스템

### 3.1 파일: `locale-prompts.ts`

각 로케일별 상세 설정을 포함합니다:

| 로케일 | CTA 플랫폼 | 주요 통화 | 검색 엔진 | 커뮤니케이션 스타일 |
|--------|-----------|----------|----------|-------------------|
| en | WhatsApp | USD | Google | Direct, benefit-focused |
| zh-TW | LINE | TWD | Google | 正式, 安全/信譽 강조 |
| zh-CN | WeChat | CNY | Google/Baidu | 实用导向, 性价比 |
| ja | LINE | JPY | Google/Yahoo Japan | 敬語, 詳細かつ正確 |
| th | LINE | THB | Google | เป็นมิตร, K-beauty 연결 |
| mn | WhatsApp | USD | Google | Тодорхой, 품질 강조 |
| ru | WhatsApp/Telegram | USD/RUB | Google/Yandex | Подробный, 자격증 강조 |

### 3.2 주요 타입

```typescript
interface LocalePromptConfig {
  locale: Locale;
  languageName: string;
  searchEngines: string[];
  communicationStyle: string;
  trustSignals: string[];
  ctaPlatform: string;
  ctaExamples: string[];
  currencyPrimary: string;
  currencySecondary?: string;
  seoKeywords: string[];
  culturalNotes: string[];
  writingGuidelines: string[];
  avoidPatterns: string[];
  seasonalConsiderations?: string;
}
```

### 3.3 주요 함수

```typescript
// 로케일별 프롬프트 생성
generateLocalePrompt(locale: Locale): string

// 로케일별 SEO 키워드 가져오기
getLocaleSEOKeywords(locale: Locale): string[]

// 로케일별 CTA 플랫폼 가져오기
getLocaleCTAPlatform(locale: Locale): string

// 로케일별 기본 통화 가져오기
getLocalePrimaryCurrency(locale: Locale): string
```

---

## 4. 카테고리별 프롬프트 시스템

### 4.1 파일: `category-prompts.ts`

5개 의료 카테고리에 대한 전문 프롬프트:

| 카테고리 | 설명 | 주요 시술 |
|---------|------|----------|
| plastic-surgery | 성형외과 | 코성형, 눈성형, 안면윤곽, 지방흡입 |
| dermatology | 피부과 | 레이저 토닝, 리쥬란, 울쎄라 |
| dental | 치과 | 임플란트, 크라운, 인비절라인 |
| health-checkup | 건강검진 | 종합검진, PET-CT, 유전자검사 |
| general | 일반 | 의료 관광 전반 정보 |

### 4.2 각 카테고리별 포함 정보

```typescript
interface CategoryPromptConfig {
  category: string;
  displayName: string;
  description: string;
  eeatSignals: string[];        // E-E-A-T 신호
  mustCoverTopics: string[];    // 필수 커버 토픽
  priceBenchmarks: Array<{      // 가격 벤치마크
    procedure: string;
    priceRange: string;
    note?: string;
  }>;
  commonFAQs: string[];         // 일반적인 FAQ
  keyProcedures: string[];      // 주요 시술
  recoveryInfo: {               // 회복 정보
    typical: string;
    factors: string[];
  };
  riskDisclaimer: string;       // 위험 고지
  qualityIndicators: string[];  // 품질 지표
}
```

### 4.3 가격 벤치마크 예시 (성형외과)

| 시술 | 가격 범위 | 비고 |
|------|----------|------|
| Rhinoplasty | $2,500-$8,000 USD | 복잡도에 따라 상이 |
| Double Eyelid | $1,500-$4,000 USD | 비절개 vs 절개 |
| Face Lift | $5,000-$15,000 USD | 미니 vs 풀 |
| Liposuction | $2,000-$6,000 USD | 부위당 |
| Breast Augmentation | $4,000-$10,000 USD | 보형물 종류에 따라 |
| Jaw Reduction | $5,000-$12,000 USD | V라인 수술 |

---

## 5. 시스템 프롬프트 v3.0

### 5.1 파일: `system-prompt.ts`

#### E-E-A-T 준수 (YMYL 콘텐츠)

- **Experience (경험)**: 실제 환자 관점, 회복 타임라인
- **Expertise (전문성)**: 의료 자격증, KFDA 승인
- **Authoritativeness (권위성)**: 통계, JCI 인증
- **Trustworthiness (신뢰성)**: 가격 범위, 위험 고지

#### AEO (Answer Engine Optimization)

- Definition Box (40-60 단어)
- Quick Answer Paragraph (45-55 단어)
- Numbered Lists (5-8 항목)
- Comparison Tables
- FAQ Section (5-7 질문)

### 5.2 콘텐츠 구조

```
1. HOOK (2-3 문장) - 즉시 문제점 해결
2. QUICK ANSWER BOX - 50단어 직접 답변
3. TL;DR SUMMARY - 3-4 불릿 포인트
4. TABLE OF CONTENTS
5. MAIN SECTIONS (H2s)
6. COST COMPARISON TABLE
7. STEP-BY-STEP PROCESS
8. FAQ SECTION
9. EXPERT TIP BOX
10. CTA SECTION
```

### 5.3 출력 포맷 (JSON)

```json
{
  "title": "키워드 최적화 제목 (max 60자)",
  "excerpt": "기사 카드용 요약 (100-150자)",
  "content": "전체 Markdown 콘텐츠",
  "metaTitle": "SEO 메타 제목 (max 60자)",
  "metaDescription": "CTA 포함 메타 설명 (150-155자)",
  "tags": ["primary-keyword", "related-term-1", ...],
  "faqSchema": [
    {"question": "질문?", "answer": "40-60단어 답변..."}
  ],
  "howToSteps": [
    {"name": "Step 1", "text": "설명..."}
  ]
}
```

---

## 6. 프롬프트 빌더

### 6.1 파일: `prompt-builder.ts`

모든 프롬프트 시스템을 통합하는 빌더입니다.

### 6.2 주요 함수

```typescript
// 통합 프롬프트 빌더 (비동기, RAG 포함)
async function buildPrompt(options: PromptBuildOptions): Promise<BuiltPrompt>

// 간단 프롬프트 생성 (동기, RAG 없이)
function buildSimplePrompt(options): { systemPrompt: string; userPrompt: string }

// 콘텐츠 타입 분석
function analyzeContentType(keyword: string): ContentType

// 검색 의도 분석
function analyzeSearchIntent(keyword: string): string
```

### 6.3 콘텐츠 타입

| 타입 | 키워드 패턴 | 권장 포맷 |
|------|-----------|----------|
| pricing | cost, price, how much | 가격 비교 테이블 |
| comparison | vs, compare, best | 비교 테이블 |
| procedural | how to, steps, process | HowTo Schema |
| guide | guide, complete, ultimate | 장문 상세 콘텐츠 |
| faq | faq, questions | Q&A 포맷 |
| informational | 기타 | 표준 E-E-A-T 구조 |

### 6.4 사용 예시

```typescript
import { buildPrompt } from '@/lib/content/prompts';

const prompt = await buildPrompt({
  keyword: 'korean rhinoplasty cost',
  locale: 'en',
  category: 'plastic-surgery',
  targetWordCount: 2000,
  includeRAG: true,
  includeLearning: true,
});

// prompt.systemPrompt - 시스템 프롬프트
// prompt.userPrompt - 사용자 프롬프트 (로케일 + 카테고리 + RAG)
// prompt.metadata - 메타데이터
```

---

## 7. 학습 RAG 시스템

### 7.1 파일: `learning-rag.ts`

고성과 콘텐츠에서 패턴을 학습하여 새 콘텐츠 생성에 활용합니다.

### 7.2 학습 데이터 구조

```typescript
interface LearningData {
  id: string;
  source_type: 'high_performer' | 'user_feedback' | 'manual_edit';
  blog_post_id: string;
  keyword_id?: string;
  locale: Locale;
  category: string;
  performance_score: number;

  // 학습 데이터
  content_excerpt: string;
  title_pattern: string;
  writing_style_notes: string;
  seo_patterns: SEOPatterns;

  // 벡터화
  is_vectorized: boolean;
  vector_id?: string;
}
```

### 7.3 성과 등급 기준

| 등급 | CTR | 순위 | 클릭수 |
|------|-----|------|-------|
| Top | ≥ 5% | ≤ 10 | ≥ 100 |
| Mid | ≥ 2% | ≤ 30 | ≥ 30 |
| Low | < 2% | > 30 | < 30 |

### 7.4 주요 함수

```typescript
// 성과 등급 결정
determinePerformanceTier(metrics: PerformanceMetrics): 'top' | 'mid' | 'low'

// 콘텐츠 분석 및 패턴 추출
analyzeContent(title, content, metadata): ContentAnalysis

// 학습 데이터 벡터화
indexLearningData(data: LearningData): Promise<string>

// 관련 학습 데이터 검색
queryLearningData(keyword, options): Promise<LearningData[]>

// 향상된 RAG 컨텍스트 생성
buildEnhancedRAGContext(keyword, locale, category): Promise<{
  learningContext: string;
  patterns: string[];
  recommendations: string[];
}>
```

---

## 8. 향후 수정 사항

### 8.1 통역사/플랫폼 정체성 반영 (TODO)

시스템 프롬프트에 다음 내용 추가 필요:

```
## 콘텐츠 작성자 정체성

모든 콘텐츠는 **의료 관광 코디네이터/통역사** 또는 **플랫폼** 관점에서 작성합니다.

### 허용되는 표현
- "저희 GetCareKorea 플랫폼에서는..."
- "많은 환자분들을 안내하면서 느낀 점은..."
- "통역사로서 병원에 동행하며 본 바로는..."
- "저희가 파트너십을 맺은 병원들에서는..."

### 피해야 할 표현
- "의사로서 말씀드리면..." (의료 전문가 사칭 금지)
- "제가 직접 시술한 경험..." (시술 경험 사칭 금지)
- "의학적으로 권장드립니다..." (의료 조언 금지)

### 역할 정의
- 정보 제공자 (Information Provider)
- 프로세스 안내자 (Process Guide)
- 환자 경험 공유자 (Patient Experience Sharer)
- 가격/품질 비교 분석가 (Price/Quality Analyst)
```

### 8.2 기존 generator.ts 업데이트 (TODO)

새 프롬프트 시스템을 기존 generator.ts에 통합 필요

---

## 9. 테스트 방법

```typescript
// 프롬프트 빌더 테스트
import { buildPrompt, buildSimplePrompt } from '@/lib/content/prompts';

// 1. 간단 프롬프트 테스트
const simple = buildSimplePrompt({
  keyword: '韓国整形 費用',
  locale: 'ja',
  category: 'plastic-surgery',
});
console.log(simple.userPrompt);

// 2. 전체 프롬프트 테스트 (RAG 포함)
const full = await buildPrompt({
  keyword: 'korean rhinoplasty cost',
  locale: 'en',
  category: 'plastic-surgery',
  includeRAG: true,
  includeLearning: true,
});
console.log(full.metadata);
```

---

## 10. 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 3.0 | 2026-01-22 | 초기 구현 - 로케일/카테고리 프롬프트, 학습 RAG |

---

## 11. 관련 문서

- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - 전체 개발 로드맵
- Phase 4: LLM 자가 학습 시스템 (예정)
- Phase 5: GSC 연동 & 성과 추적 (예정)
