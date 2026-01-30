# Automated Content System Documentation

## Overview

GetCareKorea의 완전 자동화된 콘텐츠 생성 및 발행 시스템입니다.
키워드를 등록하면 자동으로 콘텐츠가 생성되고, 품질 검증 후 발행됩니다.

## System Architecture (v2 - Unified Pipeline)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Unified Content Pipeline                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. KEYWORD MANAGEMENT                                                │
│  ┌─────────────────┐                                                  │
│  │ Admin Panel     │ → content_keywords (status: pending)            │
│  │ /admin/keywords │                                                  │
│  └─────────────────┘                                                  │
│         ↓                                                             │
│  2. CONTENT GENERATION (Manual or Cron)                              │
│  ┌─────────────────────────────────────────────────────┐              │
│  │                                                       │              │
│  │  ┌─────────────────┐    ┌─────────────────────────┐  │              │
│  │  │ Manual Generate │    │ Cron Auto-Generate      │  │              │
│  │  │ /api/content/   │    │ /api/cron/auto-generate │  │              │
│  │  │ generate        │    │                         │  │              │
│  │  └────────┬────────┘    └───────────┬─────────────┘  │              │
│  │           │                         │                 │              │
│  │           └──────────┬──────────────┘                 │              │
│  │                      ↓                                │              │
│  │  ┌───────────────────────────────────────────────┐   │              │
│  │  │  Unified Content Generation Pipeline          │   │              │
│  │  │  (content-generation-pipeline.ts)             │   │              │
│  │  │                                               │   │              │
│  │  │  1. Author Persona Fetch (5 retries)          │   │              │
│  │  │  2. Input Validation                          │   │              │
│  │  │  3. Claude AI Content Generation              │   │              │
│  │  │  4. Google Imagen 4 Image Generation          │   │              │
│  │  │  5. Database Save                             │   │              │
│  │  │  6. Atomic Rollback on Failure                │   │              │
│  │  └───────────────────────────────────────────────┘   │              │
│  │                      ↓                                │              │
│  │  blog_posts (status: draft) + Supabase Storage       │              │
│  └─────────────────────────────────────────────────────┘              │
│         ↓                                                             │
│  3. ADMIN REVIEW & PUBLISH                                            │
│  ┌─────────────────┐                                                  │
│  │ Admin Panel     │ → blog_posts (published) → ISR Revalidation     │
│  │ /admin/content  │                                                  │
│  └─────────────────┘                                                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Unified Pipeline Features

### 1. Single Source of Truth
- `src/lib/content/content-generation-pipeline.ts`에서 모든 콘텐츠 생성 로직 관리
- Manual과 Cron 모두 동일한 파이프라인 사용

### 2. Atomic Rollback
- Author Persona 조회 실패 시 → 키워드 상태를 `pending`으로 롤백
- Validation 실패 시 → 키워드 상태를 `pending`으로 롤백
- 예기치 않은 오류 시 → 키워드 상태를 `pending`으로 롤백

### 3. 5회 재시도 로직
- Author Persona 조회 시 최대 5회 재시도
- 각 시도 사이에 지수 백오프 적용

## Database Schema (Simplified v2)

### blog_posts
단일 locale당 하나의 포스트 (다국어 컬럼 제거)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| slug | text | URL slug |
| locale | text | 언어 코드 (en, ko, ja...) |
| title | text | 제목 |
| content | text | 콘텐츠 (HTML) |
| excerpt | text | 발췌 |
| seo_meta | jsonb | SEO 메타데이터 |
| category | text | 카테고리 |
| tags | text[] | 태그 배열 |
| cover_image_url | text | 커버 이미지 URL |
| cover_image_alt | text | 커버 이미지 alt |
| author_persona_id | uuid | 저자 페르소나 ID |
| status | text | draft/published/archived |
| generation_metadata | jsonb | 생성 메타데이터 |
| published_at | timestamp | 발행일 |
| view_count | int | 조회수 |

### generation_metadata JSONB 구조
```json
{
  "keyword": "韓国整形",
  "locale": "ja",
  "category": "plastic-surgery",
  "generation_cost": 0.179,
  "content_cost": 0.119,
  "image_cost": 0.060,
  "images_generated": 3,
  "faq_schema": [...],
  "howto_schema": [...],
  "internal_links": [...],
  "author_persona_id": "...",
  "author_slug": "kim-sua",
  "generated_at": "2026-01-30T..."
}
```

### seo_meta JSONB 구조
```json
{
  "meta_title": "韓国整形の真実...",
  "meta_description": "12年間の通訳経験...",
  "og_title": "韓国整形の真実...",
  "og_description": "...",
  "og_image": "https://...",
  "twitter_title": "...",
  "twitter_description": "...",
  "twitter_image": "..."
}
```

### author_personas (JSONB 구조)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| slug | text | URL slug |
| name | jsonb | {"en": "...", "ko": "...", "ja": "..."} |
| bio_short | jsonb | {"en": "...", "ko": "..."} |
| bio_full | jsonb | {"en": "...", "ko": "..."} |
| certifications | jsonb | {"en": [...], "ko": [...]} |
| languages | jsonb | [{"code": "en", "proficiency": "native"}] |
| photo_url | text | 프로필 이미지 |
| years_of_experience | int | 경력 연수 |
| is_active | boolean | 활성 상태 |

## Environment Variables

### Required (필수)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Services
ANTHROPIC_API_KEY=sk-ant-xxx        # Claude AI (콘텐츠 생성)
REPLICATE_API_TOKEN=r8_xxx          # Google Imagen 4 (이미지 생성)
OPENAI_API_KEY=sk-xxx               # Embeddings

# Upstash (Vector + Redis)
UPSTASH_VECTOR_REST_URL=https://xxx.upstash.io
UPSTASH_VECTOR_REST_TOKEN=xxx
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### Optional (선택)

```env
# Cron Security
CRON_SECRET=your-secret-key         # Cron job 인증용

# Google Search Console
GSC_SITE_URL=https://getcarekorea.com
GOOGLE_SERVICE_ACCOUNT_KEY='{...}'  # JSON 형식

# ISR Revalidation
REVALIDATION_SECRET=your-secret     # On-demand revalidation
```

## API Endpoints

### Content Generation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content/generate` | POST | 수동 콘텐츠 생성 |
| `/api/cron/auto-generate` | GET | Cron 자동 생성 |
| `/api/keywords/[id]/status` | POST | 키워드 상태 업데이트 |

### Blog Post Display
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/blog/[slug]` | GET | 블로그 포스트 조회 (locale 필터) |
| `/[locale]/blog/[slug]` | - | 블로그 포스트 페이지 |

### Admin
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content` | GET | 콘텐츠 목록 |
| `/api/content` | PUT | 콘텐츠 업데이트 |
| `/api/content` | DELETE | 콘텐츠 삭제 |

## Image Generation

### Google Imagen 4 via Replicate
- 모델: `google/imagen-4`
- 비율: 16:9
- 포맷: PNG
- 품질: 90%
- 저장: Supabase Storage (`blog-images` bucket)

### 이미지 생성 흐름
```
1. 콘텐츠에서 [IMAGE_PLACEHOLDER_N] 추출
2. 각 placeholder에 대해 이미지 프롬프트 생성
3. Replicate API로 Imagen 4 호출
4. 생성된 이미지를 Supabase Storage에 업로드
5. 영구 URL로 placeholder 교체
```

## Blog Post Rendering

### HTML 콘텐츠 지원
- 콘텐츠는 HTML 형식으로 생성됨
- `dangerouslySetInnerHTML`로 직접 렌더링
- Tailwind `prose` 클래스로 스타일링

### Locale 필터링
- 각 포스트는 특정 locale에만 표시
- `/en/blog/slug` → `locale: 'en'`인 포스트만 조회
- `/ja/blog/slug` → `locale: 'ja'`인 포스트만 조회

## Cron Jobs Schedule

| Job | Path | Schedule | Description |
|-----|------|----------|-------------|
| Auto Generate | `/api/cron/auto-generate` | 설정 가능 | 대기 키워드 콘텐츠 자동 생성 |
| Sitemap Update | `/api/cron/sitemap-update` | 매일 00:00 UTC | 사이트맵 자동 갱신 |

## Troubleshooting

### 콘텐츠 생성 실패
1. `ANTHROPIC_API_KEY` 확인
2. `REPLICATE_API_TOKEN` 확인
3. 키워드 status가 'pending'으로 롤백되었는지 확인
4. 서버 로그에서 오류 메시지 확인

### 이미지 생성 실패
1. `REPLICATE_API_TOKEN` 확인
2. Supabase Storage `blog-images` bucket 존재 확인
3. bucket이 public인지 확인

### 블로그 포스트가 보이지 않음
1. 포스트 status가 `published`인지 확인
2. locale이 URL과 일치하는지 확인
3. slug가 정확한지 확인

### Author Persona 조회 실패
1. `author_personas` 테이블에 활성화된 페르소나가 있는지 확인
2. `is_active: true`인 페르소나 존재 확인
3. 해당 locale을 지원하는 페르소나 존재 확인

## Monitoring

### 생성 비용 추적
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as posts,
  SUM((generation_metadata->>'generation_cost')::numeric) as total_cost,
  SUM((generation_metadata->>'images_generated')::int) as total_images
FROM blog_posts
WHERE generation_metadata IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 키워드 상태 확인
```sql
SELECT status, COUNT(*)
FROM content_keywords
GROUP BY status;
```

### 최근 생성된 포스트
```sql
SELECT slug, locale, title, status, created_at
FROM blog_posts
ORDER BY created_at DESC
LIMIT 10;
```
