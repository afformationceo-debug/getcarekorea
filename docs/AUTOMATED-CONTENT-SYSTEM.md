# Automated Content System Documentation

## Overview

GetCareKorea의 완전 자동화된 콘텐츠 생성 및 발행 시스템입니다.
키워드를 등록하면 매일 자동으로 콘텐츠가 생성되고, 품질 검증 후 자동 발행됩니다.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Automated Content Pipeline                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. KEYWORD MANAGEMENT                                                │
│  ┌─────────────┐                                                      │
│  │ Admin Panel │ → content_keywords (status: pending)                │
│  └─────────────┘                                                      │
│         ↓                                                             │
│  2. AUTO GENERATION (매일 09:00 UTC)                                  │
│  ┌─────────────────┐                                                  │
│  │ /api/cron/      │                                                  │
│  │ auto-generate   │ → Claude AI + DALL-E 3 → blog_posts (draft)     │
│  └─────────────────┘                                                  │
│         ↓                                                             │
│  3. QUALITY CHECK                                                     │
│  ┌─────────────────┐                                                  │
│  │ Quality Score   │ → 75점 이상 통과                                 │
│  │ Validation      │                                                  │
│  └─────────────────┘                                                  │
│         ↓                                                             │
│  4. AUTO PUBLISH (매일 10:00 UTC)                                     │
│  ┌─────────────────┐                                                  │
│  │ /api/cron/      │                                                  │
│  │ auto-publish    │ → blog_posts (published) → ISR Revalidation     │
│  └─────────────────┘                                                  │
│         ↓                                                             │
│  5. LEARNING PIPELINE (매일 06:00 UTC)                                │
│  ┌─────────────────┐                                                  │
│  │ /api/cron/      │                                                  │
│  │ gsc-collect     │ → GSC Data → High Performer Detection →          │
│  └─────────────────┘   Upstash Vector (learning data)                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Cron Jobs Schedule

| Job | Path | Schedule | Description |
|-----|------|----------|-------------|
| GSC Collect | `/api/cron/gsc-collect` | 매일 06:00 UTC | Google Search Console 데이터 수집 + 학습 |
| Auto Generate | `/api/cron/auto-generate` | 매일 09:00 UTC | 대기 키워드 콘텐츠 자동 생성 (일 5개) |
| Auto Publish | `/api/cron/auto-publish` | 매일 10:00 UTC | 고품질 드래프트 자동 발행 |
| Scheduled Publish | `/api/cron/publish-scheduled` | 매 15분 | 예약 발행 처리 |
| Sitemap Update | `/api/cron/sitemap-update` | 매일 00:00 UTC | 사이트맵 자동 갱신 |

## Environment Variables

### Required (필수)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Services
ANTHROPIC_API_KEY=sk-ant-xxx        # Claude AI
OPENAI_API_KEY=sk-xxx               # DALL-E 3 이미지 생성

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

# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ISR Revalidation
REVALIDATION_SECRET=your-secret     # On-demand revalidation
```

## Database Tables

### content_keywords
키워드 관리 테이블

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| keyword | text | 타겟 키워드 |
| locale | text | 언어 (en, ko, ja, zh-CN...) |
| category | text | 카테고리 (plastic-surgery, dental...) |
| status | text | pending/generating/generated/published/error |
| priority | int | 우선순위 (높을수록 먼저 처리) |
| blog_post_id | uuid | 생성된 포스트 ID |
| author_persona_id | uuid | 지정 저자 |
| target_publish_date | timestamp | 예약 발행일 |

### blog_posts
블로그 포스트 테이블 (다국어 필드)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| slug | text | URL slug |
| status | text | draft/scheduled/published |
| title_{locale} | text | 언어별 제목 |
| content_{locale} | text | 언어별 콘텐츠 (HTML) |
| excerpt_{locale} | text | 언어별 발췌 |
| generation_metadata | jsonb | 생성 메타데이터 |
| published_at | timestamp | 발행일 |
| scheduled_at | timestamp | 예약 발행일 |

### llm_learning_data
AI 학습 데이터

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| source_type | text | high_performer/user_feedback/manual_edit |
| blog_post_id | uuid | 원본 포스트 |
| performance_score | int | 성과 점수 (0-100) |
| content_excerpt | text | 콘텐츠 발췌 |
| seo_patterns | jsonb | SEO 패턴 분석 |
| is_vectorized | boolean | Vector 인덱싱 여부 |

### content_performance
콘텐츠 성과 데이터

| Column | Type | Description |
|--------|------|-------------|
| blog_post_id | uuid | 포스트 ID |
| gsc_impressions | int | GSC 노출 수 |
| gsc_clicks | int | GSC 클릭 수 |
| gsc_ctr | float | CTR |
| gsc_position | float | 평균 순위 |
| is_high_performer | boolean | 고성과 콘텐츠 여부 |

## Content Generation Flow

### 1. 키워드 등록
```
Admin Panel → /admin/keywords
- 키워드 입력 (예: "rhinoplasty korea cost")
- 타겟 언어 선택 (예: en)
- 카테고리 선택 (예: plastic-surgery)
- 우선순위 설정 (1-10)
- 예약 발행일 (선택)
```

### 2. 콘텐츠 자동 생성

Auto-generate cron job이 매일 실행:

1. `status: pending` 키워드 조회 (우선순위 순)
2. Claude AI로 콘텐츠 생성
   - v6 시스템 프롬프트 사용
   - RAG 컨텍스트 (SEO 가이드, 고성과 콘텐츠, 피드백)
   - 다국어 최적화
3. DALL-E 3로 이미지 생성 (3장)
4. blog_posts에 저장 (status: draft)
5. 키워드 status를 'generated'로 업데이트

### 3. 품질 검증

자동 발행 전 품질 점수 검사:
- 최소 75점 이상 필요
- 평가 항목:
  - 제목 품질 (키워드 포함, 길이)
  - 콘텐츠 길이 (최소 500자)
  - 메타 설명 존재
  - Excerpt 존재

### 4. 자동 발행

Auto-publish cron job이 매일 실행:
1. `status: draft` 포스트 조회
2. 품질 점수 75점 이상 필터링
3. 발행 처리 (status: published)
4. ISR 재검증 트리거

### 5. 학습 파이프라인

GSC Collect cron job이 매일 실행:
1. Google Search Console에서 성과 데이터 수집
2. 고성과 콘텐츠 감지 (CTR 5%+, Top 10 순위)
3. 패턴 분석 및 학습 데이터 생성
4. Upstash Vector에 인덱싱
5. 다음 콘텐츠 생성 시 RAG로 활용

## Feedback System

사용자/관리자 피드백 → AI 학습:

### 피드백 저장 경로
```
User Feedback → /api/content/feedback → Upstash Vector
                                           ↓
                          RAG Context → Content Generation
```

### 피드백 유형
- `positive`: 좋은 콘텐츠로 학습
- `negative`: 향후 피하도록 학습
- `edit`: 수정된 버전으로 학습

## Google Analytics Integration

### 설정 방법
1. [Google Analytics 4](https://analytics.google.com) 계정 생성
2. 새 속성 생성 (웹)
3. 데이터 스트림 설정
4. Measurement ID 복사 (G-XXXXXXXXXX)
5. `.env.local`에 추가:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 이벤트 트래킹
```typescript
import { sendGAEvent, sendGAConversion } from '@/components/analytics/GoogleAnalytics';

// 이벤트 전송
sendGAEvent('button_click', { button_name: 'contact_us' });

// 전환 이벤트
sendGAConversion('inquiry_submit');
```

## Google Search Console Integration

### 설정 방법
1. [Google Search Console](https://search.google.com/search-console) 접속
2. 속성 추가 및 소유권 확인
3. API 활성화:
   - [Google Cloud Console](https://console.cloud.google.com) 접속
   - Search Console API 활성화
   - 서비스 계정 생성
   - JSON 키 다운로드

4. `.env.local`에 추가:
```env
GSC_SITE_URL=https://getcarekorea.com
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

## Troubleshooting

### Cron Job이 실행되지 않음
1. Vercel Pro 플랜 확인 (Cron은 Pro+ 필요)
2. `vercel.json` 설정 확인
3. `CRON_SECRET` 환경변수 확인

### 콘텐츠 생성 실패
1. `ANTHROPIC_API_KEY` 확인
2. 키워드 status가 'error'인 경우 로그 확인
3. rate limit 확인

### 이미지 생성 실패
1. `OPENAI_API_KEY` 확인
2. 콘텐츠는 생성되나 이미지만 실패하면 로그 확인

### GSC 데이터 없음
1. GSC 서비스 계정 권한 확인
2. 사이트 소유권 확인
3. 최소 7일 이상 된 데이터만 수집됨

## API Endpoints

### Content Generation
- `POST /api/content/generate` - 단일 콘텐츠 생성 (수동)

### Feedback
- `POST /api/content/feedback` - 피드백 제출

### Admin
- `GET /api/admin/posts` - 포스트 목록
- `GET /api/admin/posts/preview/[id]` - 프리뷰

### Cron (Internal)
- `GET /api/cron/auto-generate` - 자동 생성
- `GET /api/cron/auto-publish` - 자동 발행
- `GET /api/cron/gsc-collect` - GSC 수집
- `GET /api/cron/sitemap-update` - 사이트맵 갱신
- `GET /api/cron/publish-scheduled` - 예약 발행

## Monitoring

### Cron Logs
```sql
SELECT * FROM cron_logs
ORDER BY created_at DESC
LIMIT 20;
```

### High Performers
```sql
SELECT bp.title_en, cp.gsc_ctr, cp.gsc_position, cp.gsc_clicks
FROM content_performance cp
JOIN blog_posts bp ON bp.id = cp.blog_post_id
WHERE cp.is_high_performer = true
ORDER BY cp.gsc_ctr DESC;
```

### Generation Costs
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as posts,
  SUM((generation_metadata->>'estimatedCost')::numeric) as total_cost
FROM blog_posts
WHERE generation_metadata IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;
```
