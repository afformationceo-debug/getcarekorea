# GetCareKorea 키워드 기반 콘텐츠 자동화 시스템 - 개발 로드맵

> 마지막 업데이트: 2026-01-22
> 상태: Phase 8 완료 - 전체 로드맵 완료

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [데이터베이스 스키마 확장](#2-데이터베이스-스키마-확장)
3. [Phase 1: 데이터베이스 & 키워드 일괄 등록](#3-phase-1-데이터베이스--키워드-일괄-등록)
4. [Phase 2: 콘텐츠 생성 큐 & 알림 시스템](#4-phase-2-콘텐츠-생성-큐--알림-시스템)
5. [Phase 3: 프롬프트 고도화 & RAG 강화](#5-phase-3-프롬프트-고도화--rag-강화)
6. [Phase 4: LLM 자가 학습 시스템](#6-phase-4-llm-자가-학습-시스템)
7. [Phase 5: 성과 추적 & GSC 연동](#7-phase-5-성과-추적--gsc-연동)
8. [Phase 6: 이미지 자동 생성 (나노바나나)](#8-phase-6-이미지-자동-생성-나노바나나)
9. [Phase 7: 자동 배포 & 퍼블리싱](#9-phase-7-자동-배포--퍼블리싱)
10. [Phase 8: 관리자 페이지 통합 & 환경 설정](#10-phase-8-관리자-페이지-통합--환경-설정)
11. [기술 아키텍처](#11-기술-아키텍처)
12. [개발 일정](#12-개발-일정)

---

## 1. 프로젝트 개요

### 1.1 목표
키워드 기반으로 7개 언어(영어, 번체중국어, 간체중국어, 일본어, 태국어, 몽골어, 러시아어)의 SEO 최적화 콘텐츠를 자동 생성하고, 성과를 추적하여 LLM이 자가 학습하는 시스템 구축

### 1.2 핵심 기능
- CSV 일괄 키워드 등록 (현지어|한국어|검색량 포맷)
- 선택한 키워드 일괄 콘텐츠 생성
- 생성 완료 알림
- 현지어별 맞춤 콘텐츠 (번역이 아닌 현지어 키워드 기반 생성)
- 나노바나나 API 연동 이미지 자동 생성
- Google Search Console 연동 성과 추적
- 고성과 콘텐츠 기반 LLM 자가 학습 (Upstash Vector)
- 자동 배포 및 퍼블리싱

### 1.3 기술 스택
- **프론트엔드**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **백엔드**: Next.js API Routes, Supabase (PostgreSQL)
- **AI/LLM**: Anthropic Claude Sonnet 4, OpenAI Embeddings
- **벡터 DB**: Upstash Vector
- **캐시/큐**: Upstash Redis
- **이미지 생성**: 나노바나나 API
- **분석**: Google Search Console API

---

## 2. 데이터베이스 스키마 확장

### 2.1 content_keywords 테이블 수정

```sql
-- 기존 테이블에 추가할 컬럼
ALTER TABLE content_keywords ADD COLUMN keyword_ko TEXT;           -- 한국어 키워드
ALTER TABLE content_keywords ADD COLUMN keyword_native TEXT;       -- 현지어 키워드 (원본)
ALTER TABLE content_keywords ADD COLUMN target_locale TEXT;        -- 타겟 로케일
ALTER TABLE content_keywords ADD COLUMN generation_queue_order INTEGER; -- 생성 순서
ALTER TABLE content_keywords ADD COLUMN generated_at TIMESTAMPTZ;  -- 생성 완료 시간
ALTER TABLE content_keywords ADD COLUMN generation_error TEXT;     -- 에러 로그
ALTER TABLE content_keywords ADD COLUMN quality_score INTEGER;     -- 최종 품질 점수
ALTER TABLE content_keywords ADD COLUMN image_prompt TEXT;         -- 이미지 생성용 프롬프트
ALTER TABLE content_keywords ADD COLUMN image_url TEXT;            -- 생성된 이미지 URL
```

### 2.2 content_performance 테이블 (신규)

```sql
CREATE TABLE content_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES content_keywords(id) ON DELETE SET NULL,

    -- Google Search Console 데이터
    gsc_impressions INTEGER DEFAULT 0,
    gsc_clicks INTEGER DEFAULT 0,
    gsc_ctr DECIMAL(5,4) DEFAULT 0.0000,
    gsc_position DECIMAL(5,2) DEFAULT 0.00,

    -- 트래픽 데이터
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    avg_time_on_page INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,4) DEFAULT 0.0000,

    -- 전환 데이터
    inquiry_conversions INTEGER DEFAULT 0,
    chat_conversions INTEGER DEFAULT 0,

    -- 기간
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,

    -- LLM 학습용 플래그
    is_high_performer BOOLEAN DEFAULT FALSE,
    performance_tier TEXT, -- 'top', 'mid', 'low'

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_performance_blog ON content_performance(blog_post_id);
CREATE INDEX idx_content_performance_tier ON content_performance(performance_tier);
CREATE INDEX idx_content_performance_high ON content_performance(is_high_performer) WHERE is_high_performer = TRUE;
```

### 2.3 llm_learning_data 테이블 (신규)

```sql
CREATE TABLE llm_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 소스 정보
    source_type TEXT NOT NULL, -- 'high_performer', 'user_feedback', 'manual_edit'
    blog_post_id UUID REFERENCES blog_posts(id),
    keyword_id UUID REFERENCES content_keywords(id),

    -- 학습 데이터
    content_excerpt TEXT,
    writing_style_notes TEXT,
    seo_patterns JSONB,
    locale TEXT,
    category TEXT,

    -- 벡터 임베딩 여부
    is_vectorized BOOLEAN DEFAULT FALSE,
    vector_id TEXT,

    -- 메타
    performance_score INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_llm_learning_source ON llm_learning_data(source_type);
CREATE INDEX idx_llm_learning_locale ON llm_learning_data(locale);
CREATE INDEX idx_llm_learning_vectorized ON llm_learning_data(is_vectorized);
```

### 2.4 image_generations 테이블 (신규)

```sql
CREATE TABLE image_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,

    -- 프롬프트
    prompt TEXT NOT NULL,
    negative_prompt TEXT,

    -- 결과
    image_url TEXT,
    thumbnail_url TEXT,

    -- 메타
    model TEXT DEFAULT 'nanobanana',
    status TEXT DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
    generation_time_ms INTEGER,
    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_image_generations_blog ON image_generations(blog_post_id);
CREATE INDEX idx_image_generations_status ON image_generations(status);
```

---

## 3. Phase 1: 데이터베이스 & 키워드 일괄 등록

### 상태: ✅ 완료

### 3.1 작업 목록

| # | 작업 | 상태 | 설명 |
|---|------|------|------|
| 1.1 | DB 스키마 마이그레이션 | ✅ 완료 | `003_content_keywords_extension.sql` 생성 |
| 1.2 | CSV 파싱 유틸리티 | ✅ 완료 | `src/lib/content/csv-parser.ts` |
| 1.3 | 키워드 일괄 등록 API | ✅ 완료 | `POST /api/keywords/bulk` |
| 1.4 | 관리자 UI - CSV 업로드 | ✅ 완료 | `src/components/admin/KeywordBulkUpload.tsx` |
| 1.5 | 중복 키워드 처리 로직 | ✅ 완료 | API에서 locale+keyword 조합 체크 |

### 3.2 구현된 파일 목록

```
supabase/migrations/003_content_keywords_extension.sql  - DB 스키마 확장
src/lib/content/csv-parser.ts                           - CSV 파싱 유틸리티
src/app/api/keywords/bulk/route.ts                      - 일괄 등록 API
src/components/admin/KeywordBulkUpload.tsx              - CSV 업로드 UI 컴포넌트
```

### 3.3 CSV 포맷 명세

```
키워드(현지어)|키워드(한국어)|검색량
rhinoplasty korea cost|코성형 한국 비용|2400
韓国 鼻整形 費用|코성형 한국 비용|1800
ศัลยกรรมจมูกเกาหลี|코성형 태국|890
```

### 3.4 API 명세

#### POST /api/keywords/bulk

**Request:**
```json
{
  "keywords": [
    {
      "keyword_native": "rhinoplasty korea cost",
      "keyword_ko": "코성형 한국 비용",
      "search_volume": 2400,
      "locale": "en",
      "category": "plastic-surgery"
    }
  ],
  "skip_duplicates": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "inserted": 95,
    "skipped": 5,
    "duplicates": ["keyword1", "keyword2"]
  }
}
```

---

## 4. Phase 2: 콘텐츠 생성 큐 & 알림 시스템

### 상태: ✅ 완료

### 4.1 작업 목록

| # | 작업 | 상태 | 설명 |
|---|------|------|------|
| 2.1 | 생성 큐 시스템 | ✅ 완료 | Redis 기반 생성 대기열 관리 |
| 2.2 | 다중 키워드 선택 생성 | ✅ 완료 | 관리자 다중 선택 → 일괄 생성 |
| 2.3 | 백그라운드 생성 Worker | ✅ 완료 | 순차 생성 (Rate Limit 고려) |
| 2.4 | 실시간 진행 상태 | ✅ 완료 | SSE로 진행률 표시 |
| 2.5 | 알림 시스템 | ✅ 완료 | Redis 인앱 알림, 이메일 구조 |
| 2.6 | 에러 핸들링 & 재시도 | ✅ 완료 | 실패 시 자동 재시도 (최대 3회) |

### 4.2 구현된 파일 목록

```
src/lib/content/generation-queue.ts       - Redis 기반 작업 큐 관리
src/lib/content/generation-worker.ts      - 백그라운드 작업 처리 Worker
src/app/api/content/generate/batch/route.ts - 다중 키워드 일괄 생성 API
src/app/api/content/status/route.ts       - SSE 실시간 진행 상태 API
src/lib/notifications/generation-notifications.ts - 알림 시스템
```

### 4.3 큐 구조 (Redis)

```
Queue Key: content:generation:queue
Job Structure:
{
  "id": "job-uuid",
  "keyword_id": "keyword-uuid",
  "keyword": "rhinoplasty korea",
  "locale": "en",
  "category": "plastic-surgery",
  "status": "pending|processing|completed|failed",
  "retry_count": 0,
  "created_at": "2026-01-22T10:00:00Z"
}
```

### 4.3 API 명세

#### POST /api/content/generate/batch

**Request:**
```json
{
  "keyword_ids": ["uuid1", "uuid2", "uuid3"],
  "notify_email": "admin@getcarekorea.com",
  "auto_publish": false
}
```

#### GET /api/content/status (SSE)

```
event: progress
data: {"completed": 5, "total": 10, "current": "keyword-name", "status": "generating"}

event: complete
data: {"keyword_id": "uuid", "blog_post_id": "uuid", "quality_score": 85}

event: error
data: {"keyword_id": "uuid", "error": "Rate limit exceeded", "will_retry": true}
```

---

## 5. Phase 3: 프롬프트 고도화 & RAG 강화

### 상태: ✅ 완료

### 5.1 작업 목록

| # | 작업 | 상태 | 설명 |
|---|------|------|------|
| 3.1 | 로케일별 최적화 프롬프트 | ✅ 완료 | 7개 언어 SEO/문화 특성 반영 |
| 3.2 | 카테고리별 전문 프롬프트 | ✅ 완료 | 성형, 피부, 치과, 건강검진 심화 |
| 3.3 | RAG 컨텍스트 확장 | ✅ 완료 | 고성과 콘텐츠 학습 시스템 |
| 3.4 | 시스템 프롬프트 v3 | ✅ 완료 | E-E-A-T, AEO 최적화 |
| 3.5 | 프롬프트 빌더 | ✅ 완료 | 동적 프롬프트 조합 시스템 |
| 3.6 | 현지화 CTA 최적화 | ✅ 완료 | 로케일별 메신저 자동 적용 |

### 5.2 구현된 파일 목록

```
src/lib/content/prompts/index.ts           - 프롬프트 시스템 인덱스
src/lib/content/prompts/locale-prompts.ts  - 로케일별 심화 프롬프트 (7개 언어)
src/lib/content/prompts/category-prompts.ts - 카테고리별 전문 프롬프트
src/lib/content/prompts/system-prompt.ts   - 시스템 프롬프트 v3.0
src/lib/content/prompts/prompt-builder.ts  - 통합 프롬프트 빌더
src/lib/content/learning-rag.ts            - 고성과 콘텐츠 학습 RAG 시스템
```

### 5.3 로케일별 주요 특성 (구현됨)

| 로케일 | CTA 플랫폼 | 주요 통화 | 커뮤니케이션 스타일 |
|--------|-----------|----------|-------------------|
| en | WhatsApp | USD | Direct, benefit-focused |
| zh-TW | LINE | TWD | 正式, 安全/信譽 강조 |
| zh-CN | WeChat | CNY | 实用导向, 性价比 |
| ja | LINE | JPY | 敬語, 詳細かつ正確 |
| th | LINE | THB | เป็นมิตร, K-beauty 연결 |
| mn | WhatsApp | USD | Тодорхой, 품질 강조 |
| ru | WhatsApp/Telegram | USD/RUB | Подробный, 자격증 강조 |

### 5.4 카테고리별 프롬프트 (구현됨)

- **plastic-surgery**: 성형외과 (가격 벤치마크, E-E-A-T 신호, FAQ 템플릿)
- **dermatology**: 피부과 (K-beauty, 레이저 프로토콜)
- **dental**: 치과 (임플란트, 크라운, 보증)
- **health-checkup**: 건강검진 (JCI 인증, 동일 날 결과)
- **general**: 일반 의료 관광 정보

---

## 6. Phase 4: LLM 자가 학습 시스템

### 상태: ✅ 완료

### 6.1 작업 목록

| # | 작업 | 상태 | 설명 |
|---|------|------|------|
| 4.1 | 고성과 콘텐츠 자동 감지 | ✅ 완료 | CTR/클릭/순위 기반 감지 |
| 4.2 | 학습 데이터 벡터화 | ✅ 완료 | Upstash Vector 저장 |
| 4.3 | RAG 학습 파이프라인 | ✅ 완료 | 생성 시 학습 데이터 참조 |
| 4.4 | 피드백 루프 | ✅ 완료 | 관리자 수정/피드백 학습 |
| 4.5 | Generator v3 | ✅ 완료 | 프롬프트 + RAG + 학습 통합 |

### 6.2 구현된 파일 목록

```
src/lib/content/learning-pipeline.ts  - 학습 파이프라인 핵심 로직
src/lib/content/generator-v3.ts       - 통합 생성기 v3
src/app/api/learning/route.ts         - 학습 파이프라인 API
src/app/api/learning/feedback/route.ts - 피드백 API
supabase/migrations/004_llm_learning_system.sql - DB 마이그레이션
```

### 6.3 고성과 콘텐츠 기준

| 메트릭 | 기준값 |
|--------|-------|
| CTR | ≥ 3% |
| Clicks | ≥ 50 |
| Position | ≤ 20 |
| Impressions | ≥ 500 |

### 6.4 통역사/플랫폼 정체성 (적용됨)

모든 자동 발행 콘텐츠는 **통역사/플랫폼** 관점에서 작성됩니다:
- ✅ "GetCareKorea 플랫폼에서..."
- ✅ "저희 코디네이터가..."
- ❌ "의사로서 권장드립니다..." (금지)

---

## 7. Phase 5: 성과 추적 & GSC 연동

### 상태: ✅ 완료

### 7.1 작업 목록

| # | 작업 | 상태 | 설명 |
|---|------|------|------|
| 5.1 | GSC API 연동 | ✅ 완료 | OAuth, API 클라이언트 |
| 5.2 | 성과 데이터 수집 스케줄러 | ✅ 완료 | Vercel Cron 일일 자동 수집 |
| 5.3 | 성과 대시보드 API | ✅ 완료 | 성과 요약, 로케일별 분석 |
| 5.4 | 성과 등급 자동 분류 | ✅ 완료 | Top/Mid/Low |
| 5.5 | 학습 파이프라인 연동 | ✅ 완료 | 고성과 콘텐츠 자동 학습 |

### 7.2 구현된 파일 목록

```
src/lib/gsc/client.ts              - GSC API 클라이언트
src/lib/gsc/data-collector.ts      - 데이터 수집기
src/lib/gsc/learning-integration.ts - 학습 파이프라인 연동
src/app/api/performance/route.ts    - 성과 요약 API
src/app/api/performance/[id]/route.ts - 개별 포스트 성과 API
src/app/api/cron/gsc-collect/route.ts - 일일 수집 크론잡
supabase/migrations/005_gsc_integration.sql - DB 마이그레이션
```

### 7.3 GSC 데이터 수집 항목

- Impressions (노출수)
- Clicks (클릭수)
- CTR (클릭률)
- Average Position (평균 순위)
- Query (검색어)
- Page (URL)

### 7.4 성과 등급 기준

| 등급 | CTR | Position | 조건 |
|------|-----|----------|------|
| Top | > 5% | < 10 | 둘 다 충족 |
| Mid | 2-5% | 10-30 | 하나 이상 충족 |
| Low | < 2% | > 30 | 기본 |

### 7.5 환경 변수 필요

```bash
GSC_CLIENT_ID=your-google-client-id
GSC_CLIENT_SECRET=your-google-client-secret
GSC_REFRESH_TOKEN=your-refresh-token
GSC_SITE_URL=https://getcarekorea.com
CRON_SECRET=your-cron-secret
```

---

## 8. Phase 6: 이미지 자동 생성 (나노바나나)

### 상태: ✅ 완료

### 8.1 작업 목록

| # | 작업 | 상태 | 설명 |
|---|------|------|------|
| 6.1 | 나노바나나 API 클라이언트 | ✅ 완료 | API 연동, 인증 |
| 6.2 | 이미지 프롬프트 자동 생성 | ✅ 완료 | 콘텐츠 기반 LLM 생성 |
| 6.3 | 이미지 생성 파이프라인 | ✅ 완료 | 콘텐츠 완료 → 이미지 생성 |
| 6.4 | 이미지 저장 & CDN | ✅ 완료 | Supabase Storage |
| 6.5 | 블로그 포스트 이미지 삽입 | ✅ 완료 | cover_image_url 자동 설정 |

### 8.2 구현된 파일 목록

```
src/lib/nanobanana/client.ts         - 나노바나나 API 클라이언트
src/lib/nanobanana/prompt-generator.ts - 이미지 프롬프트 자동 생성
src/lib/nanobanana/image-pipeline.ts   - 이미지 생성 파이프라인
src/app/api/images/generate/route.ts   - 이미지 생성 API
src/app/api/images/[id]/route.ts       - 개별 이미지 관리 API
supabase/migrations/006_image_generations.sql - DB 마이그레이션
```

### 8.3 이미지 프롬프트 생성 규칙

```
카테고리별 스타일:
- plastic-surgery: 깨끗한 클리닉, 전문 의료진, 모던 인테리어
- dermatology: K-beauty 느낌, 밝고 청결한 이미지
- dental: 첨단 장비, 밝은 미소
- health-checkup: 현대식 병원, 검진 장비
```

### 8.4 환경 변수 필요

```bash
NANOBANANA_API_KEY=your-nanobanana-api-key
```

---

## 9. Phase 7: 자동 배포 & 퍼블리싱

### 상태: ✅ 완료

### 9.1 작업 목록

| # | 작업 | 상태 | 설명 |
|---|------|------|------|
| 7.1 | 콘텐츠 상태 자동 전환 | ✅ 완료 | 품질 통과 시 자동 발행 |
| 7.2 | 사이트맵 자동 업데이트 | ✅ 완료 | sitemap.xml 재생성, hreflang 지원 |
| 7.3 | ISR 트리거 | ✅ 완료 | Next.js 페이지 재생성 |
| 7.4 | 예약 발행 | ✅ 완료 | Cron Job 기반 예약 발행 |
| 7.5 | 발행 이력 관리 | ✅ 완료 | publish_history 테이블 |

### 9.2 구현된 파일 목록

```
src/lib/publishing/auto-publish.ts       - 자동 발행 로직
src/lib/publishing/sitemap-generator.ts  - 사이트맵 생성
src/lib/publishing/isr-revalidation.ts   - ISR 재검증
src/app/api/publish/route.ts             - 발행 API
src/app/api/publish/[id]/route.ts        - 개별 포스트 발행 API
src/app/api/sitemap/route.ts             - 사이트맵 XML API
src/app/api/revalidate/route.ts          - ISR 재검증 API
src/app/api/cron/publish-scheduled/route.ts - 예약 발행 Cron
supabase/migrations/007_publishing_enhancements.sql
```

### 9.3 자동 발행 조건

- 품질 점수 >= 75점
- 필수 필드 모두 존재 (title, content, meta_description, excerpt)
- 이미지 생성 완료 (선택)

### 9.4 환경 변수 필요

```bash
REVALIDATION_SECRET=your-revalidation-secret
CRON_SECRET=your-cron-secret
NEXT_PUBLIC_SITE_URL=https://getcarekorea.com
```

---

## 10. Phase 8: 관리자 페이지 통합 & 환경 설정

### 상태: ✅ 완료

### 10.1 작업 목록

| # | 작업 | 상태 | 설명 |
|---|------|------|------|
| 8.1 | 관리자 대시보드 UI | ✅ 완료 | 키워드/콘텐츠/성과 통합 뷰 (기존) |
| 8.2 | 환경 변수 설정 가이드 | ✅ 완료 | 모든 API 키 설정 문서화 |
| 8.3 | 시스템 상태 모니터링 | ✅ 완료 | 서비스 상태, 큐, Cron 이력 |

### 10.2 구현된 파일 목록

```
src/app/[locale]/admin/system/page.tsx  - 시스템 상태 모니터링 페이지
docs/ENVIRONMENT_SETUP.md               - 환경 변수 설정 가이드
docs/PHASE8_IMPLEMENTATION.md           - Phase 8 구현 문서
```

### 10.3 시스템 모니터링 기능

- 서비스 상태 (Supabase, Redis, Vector, AI, GSC, 이미지)
- 큐 상태 (대기 키워드, 초안/예약 포스트, 이미지)
- 자동화 통계 (키워드, 콘텐츠, 고성과, 임베딩)
- Cron Job 실행 이력

### 10.2 관리자 대시보드 기능

- **키워드 관리**
  - CSV 업로드
  - 키워드 목록 조회/필터링
  - 생성 대기열 관리

- **콘텐츠 관리**
  - 생성 진행 상태
  - 생성된 콘텐츠 미리보기
  - 수동 편집/피드백

- **성과 대시보드**
  - 전체 성과 요약
  - 로케일별 성과
  - 고성과 콘텐츠 하이라이트

- **시스템 설정**
  - API 키 관리
  - 생성 설정 (품질 점수 기준 등)
  - 자동화 on/off 토글

### 10.3 필요 환경 변수 통합

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=

# GSC
GSC_CLIENT_ID=
GSC_CLIENT_SECRET=
GSC_REFRESH_TOKEN=
GSC_SITE_URL=

# 나노바나나 (Phase 6)
NANOBANANA_API_KEY=

# Cron
CRON_SECRET=
```

---

## 11. 기술 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN DASHBOARD                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  [CSV 업로드] → [키워드 목록] → [선택 생성] → [진행 상태] → [발행 관리]        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST /api/keywords/bulk          - CSV 일괄 등록                            │
│  POST /api/content/generate/batch - 다중 키워드 생성 요청                     │
│  GET  /api/content/status         - 생성 진행 상태 (SSE)                     │
│  POST /api/images/generate        - 이미지 생성 요청                          │
│  GET  /api/performance            - 성과 데이터 조회                          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GENERATION ENGINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │ Redis Queue  │ →  │ Content Gen  │ →  │ Image Gen    │                   │
│  │ (Upstash)    │    │ (Claude AI)  │    │ (나노바나나)  │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                   │                            │
│         │                   ▼                   │                            │
│         │         ┌──────────────┐              │                            │
│         │         │ RAG Context  │              │                            │
│         │         │ (Upstash     │◄─────────────┼────── 고성과 콘텐츠 학습    │
│         │         │  Vector DB)  │              │                            │
│         │         └──────────────┘              │                            │
│         │                   │                   │                            │
│         ▼                   ▼                   ▼                            │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │                    SUPABASE (PostgreSQL)                      │           │
│  │  content_keywords | blog_posts | content_performance | ...    │           │
│  └──────────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE TRACKING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Google Search Console API ──► 일일 수집 ──► content_performance DB         │
│                                    │                                         │
│                                    ▼                                         │
│                          고성과 콘텐츠 감지 ──► llm_learning_data            │
│                                    │                                         │
│                                    ▼                                         │
│                          Upstash Vector 자동 인덱싱 (자가 학습)              │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTO PUBLISHING                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  품질 점수 통과 → status: published → sitemap 재생성 → ISR 트리거            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. 개발 일정

| 주차 | Phase | 작업 내용 | 상태 |
|------|-------|----------|------|
| Week 1-2 | Phase 1 | DB 스키마 + CSV 일괄 등록 | ✅ 완료 |
| Week 3-4 | Phase 2 | 생성 큐 + 알림 | ✅ 완료 |
| Week 5-6 | Phase 3 | 프롬프트 고도화 + RAG 강화 | ✅ 완료 |
| Week 7-8 | Phase 4 | LLM 자가 학습 | ✅ 완료 |
| Week 9-10 | Phase 5 | GSC 연동 + 성과 추적 | ✅ 완료 |
| Week 11-12 | Phase 6 | 이미지 생성 (나노바나나) | ✅ 완료 |
| Week 13 | Phase 7 | 자동 배포 | ✅ 완료 |
| Week 14-15 | Phase 8 | 관리자 페이지 통합 | ✅ 완료 |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-22 | 1.0 | 초기 로드맵 작성 |
| 2026-01-22 | 1.1 | Phase 1 완료 - DB 스키마, CSV 파싱, 일괄 등록 API, UI 컴포넌트 |
| 2026-01-22 | 1.2 | Phase 2 완료 - Redis 큐, Worker, SSE 실시간 상태, 알림 시스템 |
| 2026-01-22 | 1.3 | Phase 3 완료 - 프롬프트 v3, 로케일/카테고리 심화, 학습 RAG 시스템 |
| 2026-01-22 | 1.4 | Phase 4 완료 - LLM 자가학습, 고성과 감지, Generator v3, 통역사/플랫폼 정체성 |
| 2026-01-22 | 1.5 | Phase 5 완료 - GSC API 클라이언트, 데이터 수집기, 성과 API, 학습 연동, Phase 8 추가 |
| 2026-01-22 | 1.6 | Phase 6 완료 - 나노바나나 API 클라이언트, 프롬프트 생성, 이미지 파이프라인, Storage 연동 |
| 2026-01-22 | 1.7 | Phase 7 완료 - 자동 발행, 사이트맵, ISR 재검증, 예약 발행, Cron Job |
| 2026-01-22 | 1.8 | Phase 8 완료 - 시스템 상태 모니터링, 환경 변수 가이드 - 전체 로드맵 완료 |

---

## 확인 필요 사항

| 항목 | 상태 | 담당 |
|------|------|------|
| 나노바나나 API 키/문서 | ⏳ 대기 | - |
| GSC OAuth 설정 | ⏳ 대기 | - |
| 알림 방식 결정 (브라우저/이메일/슬랙) | ⏳ 대기 | - |
| 자동 발행 최소 품질 점수 | 75점 | 확정 |
| 동시 생성 한도 | ⏳ 대기 | - |
