# 키워드 기반 자동 글 발행 시스템 구현 계획

> 최종 업데이트: 2026-01-22
> 목표: 완전 자동화된 다국어 콘텐츠 생성 및 발행 파이프라인 구축

---

## 📋 목차

1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [Phase별 구현 계획](#phase별-구현-계획)
4. [데이터 플로우](#데이터-플로우)
5. [기술 스택](#기술-스택)

---

## 개요

### 핵심 요구사항

**워크플로우:**
1. 키워드를 CSV 파일로 업로드
2. Generate 버튼 클릭
3. Claude AI가 SEO/AEO 최적화 글 작성
   - Google SEO 가이드 참고 (RAG)
   - 페르소나: 통역사
   - 적절한 Author 생성
   - 피드백 DB RAG 활용
   - 고성과 콘텐츠 캐싱 참고
4. DALL-E 3가 문맥에 맞는 중간 이미지 생성
5. 병렬 처리 (최대 3개 동시 작성)
6. Content 메뉴에 표시 (제목, 본문, 키워드)
7. 미리보기 기능 (실제 블로그처럼)
8. 피드백 모달 (반영/바로 업로드)
9. 피드백은 Upstash DB에 저장 (RAG)
10. 바로 업로드 시 프론트엔드 블로그 섹션에 발행
11. 업로드 링크 생성 및 표시
12. **국가별(언어팩별) 콘텐츠 자동 생성 및 발행**

### 성공 기준

- ✅ CSV 업로드 후 3분 이내 첫 콘텐츠 생성 완료
- ✅ 병렬 처리로 시간당 최대 20개 콘텐츠 생성
- ✅ Google SEO 가이드 100% 준수
- ✅ 8개 언어 자동 번역 및 현지화
- ✅ 이미지 문맥 일치도 90% 이상
- ✅ 피드백 반영 시간 1분 이내
- ✅ 발행 후 즉시 ISR 갱신

---

## 시스템 아키텍처

```
┌─────────────────┐
│  CSV Upload     │
│  (Keywords)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Keyword Processing & Queue                 │
│  - Parse CSV                                │
│  - Validate keywords                        │
│  - Create batch jobs (max 3 parallel)      │
│  - Add to Redis Queue                       │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Content Generation Pipeline (Parallel x3)  │
│  ┌─────────────────────────────────────┐   │
│  │  1. RAG Context Building            │   │
│  │     - Google SEO Guide              │   │
│  │     - High-performing content       │   │
│  │     - User feedback DB              │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  2. Content Generation (Claude)     │   │
│  │     - Persona: Interpreter          │   │
│  │     - E-E-A-T optimized             │   │
│  │     - AEO structured                │   │
│  │     - Auto author generation        │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  3. Multi-language Translation      │   │
│  │     - 8 languages parallel          │   │
│  │     - Localization (not just trans) │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  4. Image Generation (DALL-E 3)     │   │
│  │     - Context-aware prompts         │   │
│  │     - Multiple in-article images    │   │
│  │     - 1792x1024 OG image            │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  5. Save to Database                │   │
│  │     - blog_posts table              │   │
│  │     - status: draft                 │   │
│  └─────────────────────────────────────┘   │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Content Management UI                      │
│  - Table view (title, keyword, status)     │
│  - Preview button (per row)                │
│  - Feedback button                          │
│  - Publish button                           │
│  - Upload link display                      │
└────────┬────────────────────────────────────┘
         │
         ├──────────► Preview System
         │            (Real blog rendering)
         │
         ├──────────► Feedback Modal
         │            ┌───────────────────────┐
         │            │ - Feedback text input │
         │            │ - Reflect feedback btn│
         │            │ - Direct upload btn   │
         │            └───────────────────────┘
         │                     │
         │                     ▼
         │            ┌─────────────────────────┐
         │            │ Feedback Processing     │
         │            │ - Save to Upstash Vector│
         │            │ - Regenerate content    │
         │            └─────────────────────────┘
         │
         └──────────► Publish System
                      ┌─────────────────────────┐
                      │ - Update status: published│
                      │ - Trigger ISR revalidation│
                      │ - Generate upload link   │
                      │ - Update sitemap         │
                      └─────────────────────────┘
```

---

## Phase별 구현 계획

### Phase 1: 키워드 CSV 업로드 시스템 분석 및 개선

**현재 상태:**
- ✅ CSV 파싱 기능 존재 (`src/lib/content/csv-parser.ts`)
- ✅ Bulk 업로드 API 존재 (`/api/keywords/bulk`)
- ⚠️ 언어별 키워드 구분 기능 필요
- ⚠️ 우선순위 자동 할당 기능 필요

**작업 내역:**

1.1. **CSV 포맷 정의 (언어별)**
```csv
keyword,language,search_volume,competition,priority,category
안면윤곽 수술,ko,5000,high,1,procedures
Facial Contouring Surgery,en,3000,medium,1,procedures
整形手术,zh-CN,2000,medium,2,procedures
```

1.2. **CSV 파서 개선**
- 파일 위치: `src/lib/content/csv-parser.ts`
- 추가 기능:
  - 언어 감지 (language 컬럼)
  - 검색 볼륨 파싱
  - 경쟁도 파싱 (low/medium/high → 1-10 변환)
  - 우선순위 자동 계산 (search_volume / competition)
  - 중복 키워드 체크

1.3. **Bulk Upload API 개선**
- 파일 위치: `src/app/api/keywords/bulk/route.ts`
- 추가 기능:
  - 언어별 키워드 그룹화
  - 배치 크기 제한 (100개씩)
  - 트랜잭션 처리 (전체 성공/실패)
  - 진행 상황 웹소켓 전송

1.4. **Admin UI 개선**
- 파일 위치: `src/components/admin/KeywordUpload.tsx` (신규 생성)
- 기능:
  - 드래그 앤 드롭 CSV 업로드
  - CSV 미리보기 (파싱 결과)
  - 언어별 키워드 수 표시
  - 에러 검증 (중복, 형식 오류)
  - 업로드 진행률 표시

**예상 소요 시간:** 4시간

---

### Phase 2: 콘텐츠 생성 파이프라인 개선 (SEO 가이드 RAG 통합)

**현재 상태:**
- ✅ 콘텐츠 생성 파이프라인 존재 (`src/lib/content/generator-v3.ts`)
- ✅ RAG 시스템 존재 (`src/lib/content/learning-rag.ts`)
- ⚠️ Google SEO 가이드 RAG 통합 필요
- ⚠️ 페르소나 시스템 강화 필요
- ⚠️ Author 자동 생성 기능 필요

**작업 내역:**

2.1. **Google SEO 가이드 RAG 인덱싱**
- 파일 위치: `docs/google-seo-guide.md` (이미 생성됨)
- 작업:
  - SEO 가이드를 청크로 분할 (500토큰씩)
  - Upstash Vector에 임베딩 저장
  - 메타데이터 추가: section, priority, relevance
  - 인덱싱 스크립트 작성: `scripts/index-seo-guide.ts`

2.2. **RAG Context Builder 강화**
- 파일 위치: `src/lib/content/learning-rag.ts`
- 함수: `buildRAGContext()` 개선
- 추가 컨텍스트:
  1. Google SEO 가이드 (키워드 관련 섹션)
  2. 고성과 콘텐츠 (유사 키워드)
  3. 사용자 피드백 (부정적 + 긍정적)
  4. 카테고리별 베스트 프랙티스

2.3. **페르소나 시스템 구축**
- 파일 위치: `src/lib/content/prompts/persona.ts` (신규 생성)
- 페르소나: "한국 의료 관광 전문 통역사"
  - 이름: 자동 생성 (한국 이름 풀)
  - 경력: 5-15년 랜덤
  - 전문 분야: 키워드 카테고리 기반
  - 자격증: TOPIK, 의료 통역사 자격 등
  - 작성 스타일: 친절하고 전문적, 환자 중심

```typescript
interface AuthorPersona {
  name: string
  name_en: string
  years_of_experience: number
  specialties: string[]
  certifications: string[]
  bio: string
  bio_en: string
  photo_url?: string
}
```

2.4. **프롬프트 시스템 개선**
- 파일 위치: `src/lib/content/prompts/system-prompt.ts`
- v4.0 프롬프트:
  - Google SEO 가이드 전체 내용 요약 포함
  - E-E-A-T 가이드라인 강화 (특히 Experience)
  - AEO 최적화 (직접적인 답변, 구조화)
  - YMYL 콘텐츠 면책조항 자동 삽입
  - FAQ, HowTo 구조화 데이터 자동 생성

2.5. **콘텐츠 생성 함수 개선**
- 파일 위치: `src/lib/content/generator-v3.ts`
- 함수: `generateBlogPost()` 개선
- 개선 사항:
  - RAG 컨텍스트 자동 빌드
  - Author 자동 생성 및 삽입
  - 구조화된 데이터 자동 생성 (Schema.org)
  - 내부 링크 자동 추가 (관련 포스트)
  - 이미지 플레이스홀더 마크 (`[IMAGE: 설명]`)

**예상 소요 시간:** 6시간

---

### Phase 3: 다국어 콘텐츠 생성 시스템 구현

**현재 상태:**
- ✅ 번역 함수 존재 (`translateContent()`)
- ⚠️ 언어별 키워드 → 언어별 콘텐츠 매핑 필요
- ⚠️ 현지화 (Localization) 강화 필요

**작업 내역:**

3.1. **언어별 콘텐츠 생성 전략**

**옵션 A: 키워드 언어 기반 생성 (권장)**
- 한국어 키워드 → 한국어 콘텐츠 생성 → 7개 언어 번역
- 영어 키워드 → 영어 콘텐츠 생성 → 7개 언어 번역
- 장점: 키워드 언어에 최적화된 콘텐츠
- 단점: 번역 비용 증가

**옵션 B: 한국어 중심 생성**
- 모든 키워드 → 한국어 콘텐츠 생성 → 7개 언어 번역
- 장점: 일관성, 비용 절감
- 단점: 현지 최적화 부족

**결정: 옵션 A (키워드 언어 기반)**

3.2. **다국어 생성 파이프라인 구현**
- 파일 위치: `src/lib/content/multi-language-generator.ts` (신규 생성)

```typescript
async function generateMultiLanguageContent(
  keyword: ContentKeyword,
  targetLanguages: string[] = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru']
): Promise<BlogPost> {
  // 1. 기본 언어로 콘텐츠 생성 (키워드 언어)
  const baseContent = await generateBlogPost(keyword, keyword.language)

  // 2. 나머지 언어로 병렬 번역
  const translations = await Promise.all(
    targetLanguages
      .filter(lang => lang !== keyword.language)
      .map(lang => translateContent(baseContent, lang, {
        localize: true, // 현지화 활성화
        seoOptimize: true, // SEO 재최적화
        authorLocalize: true // Author 정보 현지화
      }))
  )

  // 3. 번역 결과 병합
  return mergeTrans lations(baseContent, translations)
}
```

3.3. **현지화 (Localization) 강화**
- 파일 위치: `src/lib/content/localization.ts` (신규 생성)
- 기능:
  - 날짜 형식 현지화
  - 통화 표시 현지화 (USD, KRW, JPY 등)
  - 도량형 변환 (cm ↔ inch)
  - 문화적 표현 조정
  - 예시 이름 현지화 (한국 이름 → 일본 이름)
  - 법률/의료 용어 현지화

3.4. **hreflang 태그 자동 생성**
- 파일 위치: `src/app/[locale]/blog/[slug]/page.tsx`
- 개선: 메타데이터에 hreflang 자동 추가

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPost(params.slug, params.locale)

  return {
    // ... 기존 메타데이터
    alternates: {
      languages: {
        'ko': `/ko/blog/${post.slug}`,
        'en': `/en/blog/${post.slug}`,
        'ja': `/ja/blog/${post.slug}`,
        // ... 나머지 언어
        'x-default': `/en/blog/${post.slug}`
      }
    }
  }
}
```

3.5. **언어별 발행 상태 관리**
- DB 스키마 개선: `blog_posts` 테이블
- 추가 컬럼:
  ```sql
  ALTER TABLE blog_posts ADD COLUMN published_locales TEXT[];
  ALTER TABLE blog_posts ADD COLUMN locale_metadata JSONB;
  ```
- `locale_metadata` 구조:
  ```json
  {
    "ko": {
      "published_at": "2026-01-22T10:00:00Z",
      "views": 150,
      "clicks": 20
    },
    "en": {
      "published_at": "2026-01-22T11:00:00Z",
      "views": 80,
      "clicks": 10
    }
  }
  ```

**예상 소요 시간:** 5시간

---

### Phase 4: 이미지 생성 파이프라인 개선 (문맥 인식)

**현재 상태:**
- ✅ 이미지 생성 파이프라인 존재 (`src/lib/images/image-pipeline.ts`)
- ✅ DALL-E 3 클라이언트 존재 (`src/lib/images/dalle-client.ts`)
- ⚠️ 커버 이미지만 생성 (본문 중간 이미지 없음)
- ⚠️ 문맥 인식 기능 부족

**작업 내역:**

4.1. **본문 분석 및 이미지 위치 감지**
- 파일 위치: `src/lib/images/content-analyzer.ts` (신규 생성)
- 기능:
  - 콘텐츠를 섹션별로 분할
  - 각 섹션의 주제 추출
  - 이미지가 필요한 위치 식별 (`[IMAGE: 설명]` 마커)
  - 이미지 개수 추천 (콘텐츠 길이 기반, 2000자당 1개)

```typescript
interface ImagePlacement {
  position: number // 텍스트 위치 (문자 인덱스)
  section: string // 섹션 제목
  context: string // 주변 텍스트 (500자)
  suggestedPrompt: string // 추천 프롬프트
  priority: number // 우선순위 (1-10)
}

async function analyzeContentForImages(content: string): Promise<ImagePlacement[]> {
  // 1. 마크다운 파싱
  // 2. 섹션별 분할 (H2, H3 기준)
  // 3. [IMAGE] 마커 찾기
  // 4. 문맥 추출
  // 5. 이미지 프롬프트 생성
}
```

4.2. **문맥 기반 이미지 프롬프트 생성**
- 파일 위치: `src/lib/images/context-prompt-generator.ts` (신규 생성)
- 기능:
  - 섹션 텍스트 분석 (Claude 사용)
  - 주요 키워드 추출
  - 시각적 요소 추천
  - DALL-E 3 프롬프트 생성

```typescript
async function generateContextualImagePrompt(
  placement: ImagePlacement,
  keyword: string,
  category: string
): Promise<string> {
  // Claude로 문맥 분석
  const analysis = await analyzeContext(placement.context)

  // 프롬프트 템플릿
  const prompt = `
Professional medical illustration showing ${analysis.mainSubject}.
Context: ${analysis.visualDescription}
Style: Clean, modern, medical-grade photography
Setting: ${analysis.setting || 'Korean medical clinic'}
Mood: Professional, reassuring, informative
Focus: ${analysis.focusPoints.join(', ')}
Color scheme: Clean whites, soft blues, natural skin tones
Avoid: Blood, surgical tools, distressing imagery
  `.trim()

  return prompt
}
```

4.3. **배치 이미지 생성 파이프라인**
- 파일 위치: `src/lib/images/batch-image-generator.ts` (신규 생성)
- 기능:
  - 여러 이미지 동시 생성 (병렬 처리)
  - 재시도 로직 (실패 시)
  - 진행 상황 추적
  - Supabase Storage 자동 업로드

```typescript
async function generateArticleImages(
  postId: string,
  placements: ImagePlacement[]
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = []

  // 커버 이미지 (우선 생성)
  const coverImage = await generateCoverImage(placements[0])
  images.push(coverImage)

  // 본문 이미지들 (병렬 생성, 최대 3개 동시)
  const inlineImages = await Promise.all(
    placements.slice(1).map((placement, idx) =>
      generateInlineImage(placement, idx + 1)
    )
  )
  images.push(...inlineImages)

  // Supabase Storage에 업로드
  await uploadImagesToStorage(postId, images)

  return images
}
```

4.4. **이미지 삽입 및 마크다운 업데이트**
- 파일 위치: `src/lib/content/image-injector.ts` (신규 생성)
- 기능:
  - `[IMAGE: 설명]` 마커를 실제 이미지 태그로 교체
  - Alt 텍스트 자동 생성 (SEO 최적화)
  - 이미지 크기 및 로딩 최적화

```typescript
function injectImages(content: string, images: GeneratedImage[]): string {
  let updatedContent = content

  images.forEach((image, idx) => {
    const marker = `[IMAGE: ${image.description}]`
    const imageTag = `
![${image.altText}](${image.url})
*${image.caption}*
    `.trim()

    updatedContent = updatedContent.replace(marker, imageTag)
  })

  return updatedContent
}
```

4.5. **이미지 프롬프트 DB 저장 (학습용)**
- `image_generations` 테이블 활용
- 성공적인 프롬프트 패턴 분석
- 향후 프롬프트 개선에 활용

**예상 소요 시간:** 6시간

---

### Phase 5: 병렬 콘텐츠 생성 시스템 (최대 3개)

**현재 상태:**
- ✅ Redis 큐 시스템 존재 (`src/lib/content/generation-queue.ts`)
- ✅ 워커 시스템 존재 (`src/lib/content/generation-worker.ts`)
- ⚠️ 병렬 제한 기능 없음 (무제한 병렬 가능)

**작업 내역:**

5.1. **병렬 제한 시스템 구현**
- 파일 위치: `src/lib/content/parallel-limiter.ts` (신규 생성)
- 기능:
  - Redis를 활용한 분산 락 (Distributed Lock)
  - 동시 실행 작업 수 추적
  - 최대 3개 제한 적용

```typescript
class ParallelLimiter {
  private readonly MAX_PARALLEL = 3
  private readonly LOCK_KEY = 'content:generation:locks'

  async acquireLock(jobId: string): Promise<boolean> {
    const currentLocks = await redis.scard(this.LOCK_KEY)

    if (currentLocks >= this.MAX_PARALLEL) {
      return false // 이미 3개 실행 중
    }

    await redis.sadd(this.LOCK_KEY, jobId)
    return true
  }

  async releaseLock(jobId: string): Promise<void> {
    await redis.srem(this.LOCK_KEY, jobId)
  }

  async getCurrentLocks(): Promise<string[]> {
    return await redis.smembers(this.LOCK_KEY)
  }
}
```

5.2. **워커 개선 (병렬 제한 적용)**
- 파일 위치: `src/lib/content/generation-worker.ts`
- 개선:
  - Lock 획득 시도
  - 실패 시 대기 (5초 후 재시도)
  - 성공 시 작업 실행
  - 완료 후 Lock 해제

```typescript
async function processNextJob() {
  const job = await generationQueue.getNextPendingJob()
  if (!job) return

  // Lock 획득 시도
  const acquired = await parallelLimiter.acquireLock(job.id)
  if (!acquired) {
    console.log(`Waiting for available slot (3 jobs running)`)
    setTimeout(processNextJob, 5000) // 5초 후 재시도
    return
  }

  try {
    await runContentPipeline(job)
  } finally {
    await parallelLimiter.releaseLock(job.id)
    processNextJob() // 다음 작업 처리
  }
}
```

5.3. **실시간 진행 상황 대시보드**
- 파일 위치: `src/components/admin/GenerationDashboard.tsx` (신규 생성)
- 기능:
  - 현재 실행 중인 작업 (3개)
  - 대기 중인 작업 큐
  - 완료된 작업
  - 실패한 작업
  - 실시간 로그 스트리밍

```tsx
<GenerationDashboard>
  <ActiveJobs>
    {activeJobs.map(job => (
      <JobCard
        title={job.keyword}
        progress={job.progress} // 0-100%
        stage={job.stage} // 'generating' | 'translating' | 'images'
        startedAt={job.startedAt}
      />
    ))}
  </ActiveJobs>

  <QueuedJobs count={queuedJobs.length} />

  <CompletedJobs>
    {completedJobs.map(job => (
      <CompletedJobCard
        title={job.keyword}
        duration={job.duration}
        viewLink={`/admin/content/${job.postId}`}
      />
    ))}
  </CompletedJobs>
</GenerationDashboard>
```

5.4. **진행 상황 웹소켓 연동**
- 파일 위치: `src/lib/websocket/generation-events.ts` (신규 생성)
- 이벤트:
  - `generation:started`
  - `generation:progress` (%, stage)
  - `generation:completed`
  - `generation:failed`

**예상 소요 시간:** 4시간

---

### Phase 6: Content 관리 UI 개선 (테이블, 미리보기)

**현재 상태:**
- ✅ Admin Content 페이지 존재 (`src/app/[locale]/admin/content/page.tsx`)
- ⚠️ 미리보기 버튼 없음
- ⚠️ 키워드 정보 표시 부족
- ⚠️ 업로드 링크 컬럼 없음

**작업 내역:**

6.1. **Content Table 재설계**
- 파일 위치: `src/components/admin/ContentTable.tsx` (신규 생성)
- 컬럼:
  1. **ID** (숫자)
  2. **제목** (한국어 + 영어)
  3. **키워드** (Badge 형태)
  4. **언어** (8개 언어 아이콘)
  5. **상태** (draft / review / published)
  6. **생성일**
  7. **미리보기** (버튼)
  8. **발행 링크** (published인 경우)
  9. **작업** (피드백 / 발행 / 삭제)

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>ID</TableHead>
      <TableHead>제목</TableHead>
      <TableHead>키워드</TableHead>
      <TableHead>언어</TableHead>
      <TableHead>상태</TableHead>
      <TableHead>생성일</TableHead>
      <TableHead>미리보기</TableHead>
      <TableHead>링크</TableHead>
      <TableHead>작업</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {posts.map(post => (
      <TableRow key={post.id}>
        <TableCell>{post.id}</TableCell>
        <TableCell>
          <div>{post.title_ko}</div>
          <div className="text-sm text-muted">{post.title_en}</div>
        </TableCell>
        <TableCell>
          <Badge>{post.keyword?.keyword}</Badge>
        </TableCell>
        <TableCell>
          <LanguageIcons locales={post.published_locales} />
        </TableCell>
        <TableCell>
          <StatusBadge status={post.status} />
        </TableCell>
        <TableCell>{formatDate(post.created_at)}</TableCell>
        <TableCell>
          <PreviewButton postId={post.id} />
        </TableCell>
        <TableCell>
          {post.status === 'published' && (
            <PublishedLinks post={post} />
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger>⋮</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => openFeedbackModal(post)}>
                피드백 주기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => publishPost(post)}>
                바로 발행
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deletePost(post)}>
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

6.2. **필터링 및 검색 기능**
- 상태별 필터 (draft / review / published)
- 키워드 검색
- 날짜 범위 검색
- 언어별 필터
- 정렬 (최신순, 조회수순, 알파벳순)

6.3. **대량 작업 기능**
- 체크박스로 여러 포스트 선택
- 대량 발행
- 대량 삭제
- 대량 상태 변경

6.4. **키워드 정보 패널**
- 파일 위치: `src/components/admin/KeywordInfoPanel.tsx` (신규 생성)
- 표시 정보:
  - 검색 볼륨
  - 경쟁도
  - 우선순위
  - 카테고리
  - 생성된 콘텐츠 수
  - 평균 조회수

**예상 소요 시간:** 4시간

---

### Phase 7: 미리보기 시스템 구현

**요구사항:**
- 실제 블로그에 발행된 것처럼 미리보기
- 모든 언어 버전 미리보기 가능
- 미리보기 URL은 실제 URL과 동일한 형태

**작업 내역:**

7.1. **미리보기 페이지 생성**
- 파일 위치: `src/app/[locale]/admin/preview/[postId]/page.tsx` (신규 생성)
- 기능:
  - 실제 블로그 페이지와 동일한 레이아웃
  - Draft 상태 포스트도 접근 가능 (관리자만)
  - 언어 전환 버튼

```tsx
export default async function PreviewPage({
  params,
  searchParams
}: {
  params: { locale: string; postId: string }
  searchParams: { lang?: string }
}) {
  // 관리자 권한 확인
  const user = await getCurrentUser()
  if (user?.role !== 'admin') {
    redirect('/admin/login')
  }

  // 포스트 조회 (draft도 포함)
  const selectedLang = searchParams.lang || params.locale
  const post = await getBlogPostForPreview(params.postId, selectedLang)

  return (
    <div className="preview-container">
      <PreviewHeader
        postId={params.postId}
        currentLang={selectedLang}
        availableLangs={post.published_locales}
      />

      <BlogPostLayout post={post} preview={true} />

      <PreviewFooter>
        <Button onClick={() => router.push('/admin/content')}>
          뒤로 가기
        </Button>
        <Button onClick={() => openFeedbackModal()}>
          피드백 주기
        </Button>
        <Button onClick={() => publishPost()} variant="default">
          바로 발행
        </Button>
      </PreviewFooter>
    </div>
  )
}
```

7.2. **미리보기 API 엔드포인트**
- 파일 위치: `src/app/api/admin/preview/[postId]/route.ts` (신규 생성)
- 기능:
  - Draft 포스트 조회 (관리자만)
  - 언어별 콘텐츠 반환

7.3. **미리보기 버튼 컴포넌트**
- 파일 위치: `src/components/admin/PreviewButton.tsx` (신규 생성)

```tsx
function PreviewButton({ postId, defaultLocale }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          미리보기
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SUPPORTED_LOCALES.map(locale => (
          <DropdownMenuItem key={locale} asChild>
            <Link href={`/${locale}/admin/preview/${postId}?lang=${locale}`} target="_blank">
              <Flag locale={locale} />
              {LOCALE_NAMES[locale]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

7.4. **미리보기 모드 스타일링**
- 미리보기임을 표시하는 배너
- "PREVIEW" 워터마크 (옵션)
- 피드백 하이라이팅 기능 (텍스트 선택 → 피드백)

**예상 소요 시간:** 3시간

---

### Phase 8: 피드백 시스템 구현 (모달, RAG 통합)

**요구사항:**
- 미리보기에서 피드백 주기 버튼
- 피드백 모달 (텍스트 입력)
- "피드백 반영" 버튼 → RAG 저장 + 재생성
- "바로 업로드" 버튼 → 발행

**작업 내역:**

8.1. **피드백 모달 컴포넌트**
- 파일 위치: `src/components/admin/FeedbackModal.tsx` (신규 생성)

```tsx
function FeedbackModal({ post, isOpen, onClose }: Props) {
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | 'edit'>('negative')

  const handleReflectFeedback = async () => {
    // 1. 피드백 저장 (DB + Upstash Vector)
    await saveFeedback({
      postId: post.id,
      feedback,
      feedbackType,
      adminId: currentUser.id
    })

    // 2. 재생성 큐에 추가
    await regenerateContent(post.id, feedback)

    toast.success('피드백이 반영되어 재생성이 시작되었습니다')
    onClose()
  }

  const handleDirectPublish = async () => {
    await publishPost(post.id)
    toast.success('콘텐츠가 발행되었습니다')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>피드백 주기</DialogTitle>
          <DialogDescription>
            콘텐츠에 대한 피드백을 작성하면, AI가 학습하여 다음 콘텐츠 생성 시 반영됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>콘텐츠 제목</Label>
            <p className="text-sm">{post.title_ko}</p>
          </div>

          <div>
            <Label>피드백 유형</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectItem value="positive">긍정적 피드백 (이 부분 계속 유지)</SelectItem>
              <SelectItem value="negative">부정적 피드백 (이 부분 개선 필요)</SelectItem>
              <SelectItem value="edit">수정 요청 (구체적 변경 사항)</SelectItem>
            </Select>
          </div>

          <div>
            <Label>피드백 내용</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="예: 문장이 너무 길고 복잡합니다. 짧고 간결하게 작성해주세요."
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="secondary" onClick={handleDirectPublish}>
            <Upload className="w-4 h-4 mr-2" />
            피드백 없이 바로 발행
          </Button>
          <Button onClick={handleReflectFeedback}>
            <RefreshCw className="w-4 h-4 mr-2" />
            피드백 반영 후 재생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

8.2. **피드백 저장 API**
- 파일 위치: `src/app/api/admin/feedback/route.ts` (신규 생성)

```typescript
export async function POST(req: Request) {
  const { postId, feedback, feedbackType, adminId } = await req.json()

  // 1. admin_feedback_logs 테이블에 저장
  const { data: feedbackLog } = await supabase
    .from('admin_feedback_logs')
    .insert({
      post_id: postId,
      admin_id: adminId,
      feedback_text: feedback,
      feedback_type: feedbackType,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  // 2. Upstash Vector에 임베딩 저장 (RAG용)
  const embedding = await createEmbedding(feedback)
  await vectorIndex.upsert({
    id: `feedback:${feedbackLog.id}`,
    vector: embedding,
    metadata: {
      type: 'admin_feedback',
      postId,
      feedbackType,
      keyword: post.keyword?.keyword,
      category: post.keyword?.category,
      timestamp: Date.now()
    }
  })

  // 3. llm_learning_data 테이블에 저장
  await supabase.from('llm_learning_data').insert({
    source: 'user_feedback',
    content: feedback,
    metadata: {
      postId,
      feedbackType,
      feedbackLogId: feedbackLog.id
    },
    vector_id: `feedback:${feedbackLog.id}`
  })

  return NextResponse.json({ success: true, feedbackLog })
}
```

8.3. **피드백 기반 재생성 시스템**
- 파일 위치: `src/lib/content/feedback-regeneration.ts` (신규 생성)

```typescript
async function regenerateWithFeedback(postId: string, feedback: string) {
  // 1. 기존 포스트 조회
  const post = await getBlogPost(postId)

  // 2. 피드백을 프롬프트에 포함
  const feedbackPrompt = `
이전 버전에 대한 피드백:
${feedback}

위 피드백을 반영하여 다음 사항을 개선해주세요:
- 피드백에서 지적한 부분을 수정
- 전체적인 품질 향상
- SEO 최적화 유지
  `

  // 3. RAG 컨텍스트에 이 포스트의 피드백 포함
  const ragContext = await buildRAGContext(post.keyword.keyword, {
    includeFeedback: true,
    includeThisPostFeedback: true,
    postId
  })

  // 4. 재생성
  const regeneratedPost = await generateBlogPost(
    post.keyword,
    post.locale,
    {
      ...ragContext,
      additionalInstructions: feedbackPrompt,
      improvementMode: true
    }
  )

  // 5. 기존 포스트 업데이트 (버전 관리)
  await updateBlogPost(postId, {
    ...regeneratedPost,
    version: post.version + 1,
    previous_version_id: postId
  })
}
```

8.4. **피드백 분석 대시보드**
- 파일 위치: `src/components/admin/FeedbackAnalytics.tsx` (신규 생성)
- 표시 정보:
  - 총 피드백 수
  - 피드백 유형별 통계
  - 가장 많이 지적된 문제
  - 피드백 반영 후 개선도

**예상 소요 시간:** 5시간

---

### Phase 9: 자동 발행 시스템 (프론트엔드 블로그)

**요구사항:**
- "바로 업로드" 버튼 클릭 시 프론트엔드 블로그에 발행
- 업로드 링크 생성
- Content 메뉴에 업로드 링크 표시

**작업 내역:**

9.1. **발행 API**
- 파일 위치: `src/app/api/admin/publish/route.ts` (이미 존재, 개선)
- 개선 사항:
  - 다국어 발행 지원
  - ISR revalidation 트리거
  - Sitemap 업데이트
  - 업로드 링크 생성

```typescript
export async function POST(req: Request) {
  const { postId, locales } = await req.json()

  // 1. 포스트 상태 업데이트
  const { data: post } = await supabase
    .from('blog_posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_locales: locales
    })
    .eq('id', postId)
    .select()
    .single()

  // 2. 각 언어별 ISR revalidation
  for (const locale of locales) {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.REVALIDATION_SECRET,
        paths: [
          `/${locale}/blog`,
          `/${locale}/blog/${post.slug}`
        ]
      })
    })
  }

  // 3. Sitemap 재생성
  await generateSitemap()

  // 4. 업로드 링크 생성
  const uploadLinks = locales.map(locale => ({
    locale,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/blog/${post.slug}`,
    previewUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/blog/${post.slug}?preview=true`
  }))

  return NextResponse.json({
    success: true,
    post,
    uploadLinks
  })
}
```

9.2. **발행 링크 컴포넌트**
- 파일 위치: `src/components/admin/PublishedLinks.tsx` (신규 생성)

```tsx
function PublishedLinks({ post }: { post: BlogPost }) {
  const uploadLinks = post.published_locales.map(locale => ({
    locale,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/blog/${post.slug}`
  }))

  return (
    <div className="space-y-1">
      {uploadLinks.map(link => (
        <div key={link.locale} className="flex items-center gap-2">
          <Flag locale={link.locale} />
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            {link.url}
          </a>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(link.url)}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
```

9.3. **발행 후 알림**
- 이메일 알림 (관리자에게)
- 슬랙 웹훅 (옵션)
- 발행 성공/실패 토스트

9.4. **발행 이력 추적**
- 테이블: `publishing_history` (신규 생성)
- 저장 정보:
  - 발행 일시
  - 발행자
  - 발행된 언어
  - 발행 URL
  - ISR revalidation 성공/실패

```sql
CREATE TABLE publishing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  published_by UUID REFERENCES profiles(id),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locales TEXT[],
  urls JSONB, -- {locale: url}
  revalidation_results JSONB,
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT
);
```

**예상 소요 시간:** 3시간

---

### Phase 10: 통합 테스트 및 최적화

**작업 내역:**

10.1. **엔드-투-엔드 테스트**
- CSV 업로드 → 생성 → 미리보기 → 피드백 → 발행 전체 플로우
- 3개 병렬 생성 테스트
- 다국어 콘텐츠 생성 테스트
- 이미지 생성 및 삽입 테스트

10.2. **성능 최적화**
- Redis 큐 최적화
- 데이터베이스 쿼리 최적화 (인덱스 추가)
- 이미지 압축 및 최적화
- API 응답 시간 개선

10.3. **에러 처리 강화**
- 재시도 로직 (네트워크 에러, API 타임아웃)
- 에러 로깅 (Sentry 통합)
- 사용자 친화적 에러 메시지

10.4. **문서화**
- 사용자 가이드 (CSV 포맷, 워크플로우)
- 개발자 문서 (API 레퍼런스, 아키텍처)
- 트러블슈팅 가이드

10.5. **모니터링 설정**
- 생성 성공률 추적
- 평균 생성 시간 추적
- API 비용 추적 (Claude, OpenAI, DALL-E)
- 에러율 모니터링

**예상 소요 시간:** 6시간

---

## 데이터 플로우

### 전체 워크플로우

```
1. CSV 업로드
   ↓
2. 키워드 파싱 및 검증
   ↓
3. Redis 큐에 작업 추가
   ↓
4. 병렬 처리 시작 (최대 3개)
   ├─ 작업 1 (Lock 획득)
   │   ├─ RAG 컨텍스트 빌드
   │   │   ├─ Google SEO 가이드 검색
   │   │   ├─ 고성과 콘텐츠 검색
   │   │   └─ 피드백 DB 검색
   │   ├─ Claude로 콘텐츠 생성 (기본 언어)
   │   ├─ 다국어 번역 (7개 언어 병렬)
   │   ├─ 이미지 위치 분석
   │   ├─ DALL-E 3로 이미지 생성 (병렬)
   │   ├─ 이미지 Supabase Storage 업로드
   │   ├─ 이미지 마크다운 삽입
   │   ├─ DB에 저장 (status: draft)
   │   └─ Lock 해제
   ├─ 작업 2 (Lock 획득)
   └─ 작업 3 (Lock 획득)
   ↓
5. Admin UI에 표시
   ├─ 테이블 행 추가
   └─ 실시간 업데이트
   ↓
6. 관리자 검토
   ├─ 미리보기 클릭
   │   └─ 실제 블로그처럼 렌더링
   ├─ 피드백 주기 (선택)
   │   ├─ 피드백 모달 열기
   │   ├─ 피드백 작성
   │   └─ 피드백 반영
   │       ├─ Upstash Vector에 저장
   │       ├─ 재생성 큐에 추가
   │       └─ 3단계로 돌아가기
   └─ 바로 발행
       ├─ 상태 업데이트 (published)
       ├─ ISR revalidation
       ├─ Sitemap 업데이트
       └─ 업로드 링크 생성
   ↓
7. 프론트엔드 블로그에 표시
   ├─ 8개 언어 버전 생성
   └─ 검색 엔진 크롤링 대기
```

### 피드백 루프

```
고성과 콘텐츠 (Google Analytics)
         ↓
   Upstash Vector 저장
         ↓
    RAG 컨텍스트
         ↓
   다음 콘텐츠 생성 시 참고
         ↓
   (반복)
```

---

## 기술 스택

### 핵심 기술

| 레이어 | 기술 | 용도 |
|-------|------|------|
| **프론트엔드** | Next.js 16, React 19, TypeScript | UI/UX, SSR/ISR |
| **데이터베이스** | Supabase (PostgreSQL) | 콘텐츠, 키워드, 메타데이터 저장 |
| **AI 콘텐츠 생성** | Claude (Anthropic) | 블로그 포스트 생성, 번역 |
| **AI 이미지 생성** | DALL-E 3 (OpenAI) | 본문 이미지, 커버 이미지 |
| **임베딩** | OpenAI Embeddings | 텍스트 벡터화 |
| **벡터 DB** | Upstash Vector | RAG (검색 증강 생성) |
| **큐/캐싱** | Upstash Redis | 비동기 작업 큐, 분산 락 |
| **스토리지** | Supabase Storage | 이미지 저장 |
| **분석** | Google Search Console | 성과 추적 |
| **다국어** | next-intl | 8개 언어 라우팅 |

### API 사용량 및 비용 예상

**콘텐츠 1개 생성 기준:**

| 서비스 | 작업 | 토큰/요청 | 비용 (USD) |
|--------|-----|----------|-----------|
| Claude Sonnet | 기본 콘텐츠 생성 | ~10K input, ~3K output | $0.08 |
| Claude Sonnet | 번역 (x7) | ~2K input x7, ~2K output x7 | $0.35 |
| OpenAI Embeddings | 임베딩 (x8 언어) | ~1K tokens x8 | $0.001 |
| DALL-E 3 | 이미지 생성 (x3) | 3 images (1792x1024 HD) | $0.36 |
| **총합** | - | - | **$0.79** |

**시간당 생성량 (3개 병렬, 평균 15분/개):**
- 생성량: 12개/시간
- 비용: $9.48/시간

**월 예상 (일 8시간 x 20일):**
- 생성량: 1,920개/월
- 비용: $1,516/월

### 최적화 전략

1. **캐싱 활용**
   - 유사 키워드는 기존 콘텐츠 일부 재사용
   - 번역 캐싱 (동일 문장 재번역 방지)

2. **배치 처리**
   - 임베딩 배치 요청 (OpenAI batch API)
   - 번역 배치 처리

3. **모델 선택**
   - 간단한 작업은 Claude Haiku 사용 (1/10 비용)
   - 이미지는 standard 품질 우선, HD는 선택적

---

## 일정 및 리소스

### 예상 총 소요 시간

| Phase | 작업 내용 | 시간 |
|-------|----------|------|
| Phase 1 | CSV 업로드 시스템 | 4시간 |
| Phase 2 | 콘텐츠 생성 파이프라인 (SEO RAG) | 6시간 |
| Phase 3 | 다국어 시스템 | 5시간 |
| Phase 4 | 이미지 생성 파이프라인 | 6시간 |
| Phase 5 | 병렬 처리 시스템 | 4시간 |
| Phase 6 | Content 관리 UI | 4시간 |
| Phase 7 | 미리보기 시스템 | 3시간 |
| Phase 8 | 피드백 시스템 | 5시간 |
| Phase 9 | 자동 발행 시스템 | 3시간 |
| Phase 10 | 통합 테스트 | 6시간 |
| **총합** | | **46시간** |

**예상 완료: 6-7 작업일** (1일 8시간 기준)

---

## 성공 메트릭

### KPI (Key Performance Indicators)

1. **생성 속도**
   - 목표: 콘텐츠 1개 생성 15분 이내
   - 측정: 평균 생성 시간

2. **품질**
   - 목표: 관리자 만족도 90% 이상 (피드백 없이 발행)
   - 측정: 피드백 없이 발행된 비율

3. **SEO 성과**
   - 목표: 발행 후 30일 내 검색 노출 80% 이상
   - 측정: Google Search Console

4. **다국어 품질**
   - 목표: 번역 정확도 95% 이상
   - 측정: 샘플 검토, 사용자 피드백

5. **시스템 안정성**
   - 목표: 성공률 95% 이상
   - 측정: 생성 성공/실패 비율

---

## 리스크 및 대응

| 리스크 | 영향 | 확률 | 대응 방안 |
|--------|------|------|----------|
| API 비용 초과 | 높음 | 중간 | 월 예산 설정, 알람, 자동 중지 |
| Claude API 장애 | 높음 | 낮음 | 재시도 로직, 대체 모델 (GPT-4) |
| DALL-E API 장애 | 중간 | 낮음 | Nanobanana 자동 전환 |
| 번역 품질 문제 | 중간 | 중간 | 번역 검토 단계 추가, 피드백 수집 |
| 데이터베이스 부하 | 중간 | 낮음 | 연결 풀 최적화, 읽기 전용 replica |
| Redis 큐 지연 | 낮음 | 낮음 | 큐 모니터링, 자동 스케일링 |

---

## 다음 단계

1. **환경 변수 설정 완료**
   - Supabase, Anthropic, OpenAI API 키 입력
   - `.env.local` 파일 업데이트

2. **Phase 1부터 순차 구현**
   - 각 Phase 완료 시 테스트
   - 문제 발생 시 즉시 수정

3. **파일럿 테스트**
   - 10개 키워드로 테스트
   - 전체 플로우 검증
   - 성능 및 비용 측정

4. **프로덕션 배포**
   - Vercel 배포
   - 환경 변수 설정
   - Cron 작업 활성화

---

## 참고 문서

- [Google SEO 가이드](./google-seo-guide.md)
- [환경 변수 설정](./ENVIRONMENT_SETUP.md)
- [데이터베이스 스키마](./architecture/database-schema.md)
- [API 레퍼런스](./api/api-reference.md)
