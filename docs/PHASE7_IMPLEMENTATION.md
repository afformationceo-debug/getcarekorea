# Phase 7: 자동 발행 시스템 - 구현 문서

> 완료일: 2026-01-22
> 버전: 1.0

---

## 1. 개요

Phase 7에서는 콘텐츠 자동 발행 시스템을 구현했습니다.

### 1.1 주요 목표
- 품질 점수 기반 자동 발행 검증
- 예약 발행 기능
- 동적 사이트맵 생성 및 검색 엔진 알림
- ISR (Incremental Static Regeneration) 재검증
- Cron Job을 통한 예약 발행 자동화

### 1.2 발행 조건

| 조건 | 기본값 | 설명 |
|-----|-------|------|
| 최소 품질 점수 | 75점 | V3 품질 점수 기준 |
| 이미지 필수 | false | 커버 이미지 없어도 발행 가능 |
| 메타 설명 필수 | true | SEO 필수 |
| 발췌문 필수 | true | 리스트 표시용 |

---

## 2. 구현된 파일 구조

```
src/lib/publishing/
├── auto-publish.ts        # 자동 발행 로직
├── sitemap-generator.ts   # 사이트맵 생성
├── isr-revalidation.ts    # ISR 재검증
└── index.ts               # 모듈 exports

src/app/api/publish/
├── route.ts               # 발행 API (단일/배치/자동)
└── [id]/
    └── route.ts           # 개별 포스트 발행 API

src/app/api/sitemap/
└── route.ts               # 사이트맵 XML API

src/app/api/revalidate/
└── route.ts               # ISR 재검증 API

src/app/api/cron/
└── publish-scheduled/
    └── route.ts           # 예약 발행 Cron Job

supabase/migrations/
└── 007_publishing_enhancements.sql
```

---

## 3. 자동 발행 시스템

### 3.1 파일: `auto-publish.ts`

#### 주요 함수

```typescript
// 발행 가능 여부 검증
validateForPublishing(supabase, blogPostId, criteria?): Promise<PublishValidationResult>

// 단일 포스트 자동 발행
autoPublishPost(supabase, blogPostId, criteria?): Promise<AutoPublishResult>

// 배치 자동 발행
autoPublishBatch(supabase, blogPostIds, criteria?): Promise<BatchPublishResult>

// 조건 충족 포스트 자동 발행
autoPublishPendingPosts(supabase, options?): Promise<BatchPublishResult>

// 예약 발행 설정
schedulePublication(supabase, blogPostId, scheduledAt): Promise<{success, error?}>

// 예약된 포스트 처리 (Cron용)
processScheduledPosts(supabase): Promise<BatchPublishResult>

// 예약 취소
cancelScheduledPublication(supabase, blogPostId): Promise<{success, error?}>
```

#### 검증 결과 타입

```typescript
interface PublishValidationResult {
  isValid: boolean;         // 모든 필수 조건 충족
  canPublish: boolean;      // 발행 가능 (유효 + 미발행 상태)
  qualityScore?: QualityScoreV3;  // V3 품질 점수
  issues: string[];         // 발행 불가 사유
  warnings: string[];       // 경고 (발행은 가능)
}
```

### 3.2 발행 기준 (PublishingCriteria)

```typescript
const DEFAULT_PUBLISHING_CRITERIA: PublishingCriteria = {
  minQualityScore: 75,        // 최소 품질 점수
  requireImage: false,        // 이미지 필수 여부
  requireMetaDescription: true, // 메타 설명 필수
  requireExcerpt: true,       // 발췌문 필수
};
```

---

## 4. 사이트맵 생성

### 4.1 파일: `sitemap-generator.ts`

#### 주요 함수

```typescript
// 블로그 사이트맵 생성
generateBlogSitemap(supabase, baseUrl): Promise<SitemapGenerationResult>

// 전체 사이트맵 생성 (정적 페이지 + 블로그)
generateFullSitemap(supabase, baseUrl): Promise<SitemapGenerationResult>

// 사이트맵 인덱스 생성 (대규모 사이트용)
generateSitemapIndex(sitemaps, baseUrl): string

// 검색 엔진 알림
pingSearchEngines(sitemapUrl): Promise<{google: boolean, bing: boolean}>
```

### 4.2 사이트맵 URL 구조

```typescript
interface SitemapUrl {
  loc: string;              // URL
  lastmod?: string;         // 마지막 수정일
  changefreq?: string;      // 변경 빈도
  priority?: number;        // 우선순위 (0.0-1.0)
  alternates?: {            // hreflang 대체 링크
    hreflang: string;
    href: string;
  }[];
}
```

### 4.3 정적 페이지 우선순위

| 페이지 | 우선순위 |
|-------|---------|
| 홈 | 1.0 |
| hospitals | 0.9 |
| interpreters | 0.9 |
| procedures | 0.9 |
| blog | 0.9 |
| about | 0.7 |
| contact | 0.7 |
| 블로그 포스트 | 0.8 |

---

## 5. ISR 재검증

### 5.1 파일: `isr-revalidation.ts`

#### 주요 함수

```typescript
// 발행 시 재검증
revalidateOnPublish(slug, locale, secret?): Promise<RevalidationResult>

// 경로 재검증
revalidatePaths(paths, secret?): Promise<RevalidationResult>

// 태그 재검증
revalidateTags(tags, secret?): Promise<RevalidationResult>

// 블로그 관련 페이지 전체 재검증
revalidateBlogPages(slug, locale, secret?): Promise<RevalidationResult>
```

### 5.2 재검증 대상 경로

발행 시 다음 경로가 자동 재검증됩니다:

```
/{locale}/blog/{slug}      # 개별 포스트
/{locale}/blog             # 블로그 목록
/{locale}                  # 홈페이지
```

---

## 6. API 명세

### 6.1 GET /api/publish

발행 대기 중인 콘텐츠 목록 조회

**Query Parameters:**
- `status`: 상태 필터 (기본 'draft,pending')
- `limit`: 최대 개수 (기본 50)
- `validate`: 검증 수행 여부 (기본 false)

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "totalCount": 10,
    "validationResults": [...],
    "criteria": {
      "minQualityScore": 75,
      "requireImage": false,
      "requireMetaDescription": true,
      "requireExcerpt": true
    }
  }
}
```

### 6.2 POST /api/publish

콘텐츠 발행

**Request (단일):**
```json
{
  "blogPostId": "uuid"
}
```

**Request (예약):**
```json
{
  "blogPostId": "uuid",
  "schedule": true,
  "scheduledAt": "2026-01-25T09:00:00Z"
}
```

**Request (배치):**
```json
{
  "blogPostIds": ["uuid1", "uuid2"]
}
```

**Request (자동):**
```json
{
  "autoPublish": true,
  "dryRun": false
}
```

### 6.3 GET /api/publish/[id]

특정 포스트의 발행 상태 및 검증 결과

### 6.4 POST /api/publish/[id]

특정 포스트 발행 또는 예약

### 6.5 DELETE /api/publish/[id]

발행 취소 또는 예약 취소

### 6.6 GET /api/sitemap

사이트맵 XML 생성

**Query Parameters:**
- `type`: 'full' | 'blog' (기본 'full')
- `format`: 'xml' | 'json' (기본 'xml')

### 6.7 POST /api/sitemap

사이트맵 재생성 및 검색 엔진 알림 (관리자 전용)

### 6.8 POST /api/revalidate

ISR 재검증 트리거

**Request:**
```json
{
  "paths": ["/en/blog/my-post"],
  "tags": ["blog", "posts"],
  "secret": "your-revalidation-secret"
}
```

---

## 7. DB 스키마

### 7.1 blog_posts 추가 컬럼

```sql
-- 예약 발행 시간
ALTER TABLE blog_posts ADD COLUMN scheduled_at TIMESTAMPTZ;

-- 최초 발행 시간 (수정해도 유지)
ALTER TABLE blog_posts ADD COLUMN first_published_at TIMESTAMPTZ;

-- 마지막 ISR 재검증 시간
ALTER TABLE blog_posts ADD COLUMN last_revalidated_at TIMESTAMPTZ;

-- 사이트맵 포함 여부
ALTER TABLE blog_posts ADD COLUMN sitemap_included BOOLEAN DEFAULT TRUE;

-- 사이트맵 우선순위
ALTER TABLE blog_posts ADD COLUMN sitemap_priority DECIMAL(2,1) DEFAULT 0.7;

-- 변경 빈도
ALTER TABLE blog_posts ADD COLUMN sitemap_changefreq TEXT DEFAULT 'weekly';
```

### 7.2 publish_history 테이블

```sql
CREATE TABLE publish_history (
    id UUID PRIMARY KEY,
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id),

    -- 발행 정보
    action TEXT NOT NULL, -- 'publish', 'unpublish', 'schedule', 'revalidate'
    previous_status TEXT,
    new_status TEXT,

    -- 메타
    triggered_by TEXT,    -- 'manual', 'scheduled', 'auto', 'cron'
    user_id UUID,

    -- 결과
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    details JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 sitemap_cache 테이블

```sql
CREATE TABLE sitemap_cache (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL UNIQUE, -- 'full', 'blog', 'pages'
    xml_content TEXT NOT NULL,
    url_count INTEGER DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);
```

---

## 8. Cron Job 설정

### 8.1 vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "0/15 * * * *"
    },
    {
      "path": "/api/cron/gsc-collect",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 8.2 예약 발행 플로우

```
1. POST /api/publish/{id}
   - scheduledAt: "2026-01-25T09:00:00Z"
   ↓
2. blog_posts.status = 'scheduled'
   blog_posts.scheduled_at = "2026-01-25T09:00:00Z"
   ↓
3. Cron Job (15분마다 실행)
   GET /api/cron/publish-scheduled
   ↓
4. scheduled_at <= NOW() 인 포스트 조회
   ↓
5. autoPublishPost() 호출
   ↓
6. status = 'published', published_at = NOW()
```

---

## 9. 사용 방법

### 9.1 단일 포스트 발행

```typescript
import { autoPublishPost } from '@/lib/publishing';

const result = await autoPublishPost(supabase, 'post-uuid');
if (result.success) {
  console.log(`Published at ${result.publishedAt}`);
} else {
  console.error(`Failed: ${result.issues?.join(', ')}`);
}
```

### 9.2 예약 발행

```typescript
import { schedulePublication } from '@/lib/publishing';

const result = await schedulePublication(
  supabase,
  'post-uuid',
  new Date('2026-01-25T09:00:00Z')
);
```

### 9.3 조건 충족 포스트 자동 발행

```typescript
import { autoPublishPendingPosts } from '@/lib/publishing';

// 드라이런 (실제 발행 안 함)
const dryResult = await autoPublishPendingPosts(supabase, { dryRun: true });
console.log(`Would publish: ${dryResult.published}`);

// 실제 발행
const result = await autoPublishPendingPosts(supabase);
console.log(`Published: ${result.published}/${result.total}`);
```

### 9.4 API 호출

```bash
# 단일 발행
curl -X POST /api/publish \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"blogPostId": "uuid"}'

# 예약 발행
curl -X POST /api/publish/{id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"scheduledAt": "2026-01-25T09:00:00Z"}'

# 사이트맵 조회
curl /api/sitemap

# ISR 재검증
curl -X POST /api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"paths": ["/en/blog/my-post"], "secret": "your-secret"}'
```

---

## 10. 환경 변수

```bash
# ISR 재검증 비밀 키
REVALIDATION_SECRET=your-revalidation-secret

# Cron Job 인증 키
CRON_SECRET=your-cron-secret

# 사이트 URL
NEXT_PUBLIC_SITE_URL=https://getcarekorea.com
```

---

## 11. 발행 상태 전환

```
[draft] → [scheduled] → [published]
   ↓          ↓            ↓
   └──────────┴────────────┘
              ↓
           [draft] (발행/예약 취소 시)
```

### 상태별 설명

| 상태 | 설명 |
|-----|------|
| draft | 작성 중 (기본) |
| pending | 검토 대기 |
| scheduled | 예약 발행 대기 |
| published | 발행됨 |
| archived | 보관됨 |

---

## 12. 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-22 | 초기 구현 - 자동 발행, 사이트맵, ISR, 예약 발행 |

---

## 13. 관련 문서

- [PHASE6_IMPLEMENTATION.md](./PHASE6_IMPLEMENTATION.md) - 이미지 자동 생성
- [PHASE5_IMPLEMENTATION.md](./PHASE5_IMPLEMENTATION.md) - GSC 연동
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - 전체 로드맵
