# Phase 5: GSC 연동 & 성과 추적 - 구현 문서

> 완료일: 2026-01-22
> 버전: 1.0

---

## 1. 개요

Phase 5에서는 Google Search Console API 연동 및 성과 추적 시스템을 구현했습니다.

### 1.1 주요 목표
- GSC API 연동 (OAuth 2.0)
- 일일 자동 성과 데이터 수집
- 성과 등급 자동 분류 (Top/Mid/Low)
- 고성과 콘텐츠 자동 학습 연동
- 성과 대시보드 API

### 1.2 수집 데이터
- **Impressions**: 노출수
- **Clicks**: 클릭수
- **CTR**: 클릭률
- **Average Position**: 평균 순위
- **Query**: 검색어
- **Page**: URL

---

## 2. 구현된 파일 구조

```
src/lib/gsc/
├── client.ts                    # GSC API 클라이언트
├── data-collector.ts            # 데이터 수집기
├── learning-integration.ts      # 학습 파이프라인 연동
└── index.ts                     # 모듈 exports

src/app/api/performance/
├── route.ts                     # 성과 요약 API
└── [id]/
    └── route.ts                 # 개별 포스트 성과 API

src/app/api/cron/
└── gsc-collect/
    └── route.ts                 # 일일 수집 크론잡

supabase/migrations/
└── 005_gsc_integration.sql      # DB 마이그레이션
```

---

## 3. GSC API 클라이언트

### 3.1 파일: `client.ts`

#### 주요 클래스

```typescript
class GSCClient {
  // 페이지별 성과 데이터 조회
  getPagePerformance(startDate, endDate, rowLimit): Promise<GSCPerformanceData[]>

  // 특정 페이지 성과 조회
  getPerformanceForPage(pageUrl, startDate, endDate): Promise<GSCPagePerformance | null>

  // 모든 페이지 집계 성과
  getAllPagesPerformance(startDate, endDate, rowLimit): Promise<GSCPagePerformance[]>

  // 사이트 목록 (인증 테스트용)
  listSites(): Promise<string[]>
}
```

#### 환경 변수 설정

```bash
# .env.local
GSC_CLIENT_ID=your-google-client-id
GSC_CLIENT_SECRET=your-google-client-secret
GSC_REFRESH_TOKEN=your-refresh-token
GSC_SITE_URL=https://getcarekorea.com
CRON_SECRET=your-cron-secret
```

### 3.2 성과 등급 분류

| 등급 | CTR | Position | 조건 |
|------|-----|----------|------|
| Top | > 5% | < 10 | 둘 다 충족 |
| Mid | 2-5% | 10-30 | 하나 이상 충족 |
| Low | < 2% | > 30 | 기본 |

### 3.3 고성과 콘텐츠 기준

```typescript
isHighPerformer(ctr, clicks, position, impressions): boolean
// CTR >= 3% AND Clicks >= 50 AND Position <= 20 AND Impressions >= 500
```

---

## 4. 데이터 수집기

### 4.1 파일: `data-collector.ts`

#### 주요 함수

```typescript
// 전체 GSC 데이터 수집
collectGSCData(supabase, daysAgo): Promise<DataCollectionResult>

// 특정 포스트 데이터 수집
collectGSCDataForPost(supabase, blogPostId, daysAgo): Promise<GSCPagePerformance | null>

// 배치 수집
collectGSCDataBatch(supabase, options): Promise<DataCollectionResult>

// 성과 요약 조회
getPerformanceSummary(supabase, daysAgo): Promise<PerformanceSummary | null>

// 로케일별 성과 요약
getPerformanceSummaryByLocale(supabase, daysAgo): Promise<Map<string, PerformanceSummary> | null>
```

#### 수집 플로우

```
1. createGSCClient() - GSC 클라이언트 생성
       ↓
2. getAllPagesPerformance() - 모든 페이지 성과 조회
       ↓
3. URL 매핑 - GSC URL → blog_post_id
       ↓
4. 성과 등급 분류 - classifyPerformanceTier()
       ↓
5. 고성과 판단 - isHighPerformer()
       ↓
6. DB 저장 - content_performance 테이블
```

---

## 5. API 명세

### 5.1 GET /api/performance

성과 요약 조회

**Query Parameters:**
- `days` (optional): 조회 기간 (기본 28일)
- `byLocale` (optional): 로케일별 요약 포함 여부

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPosts": 150,
      "topTier": 15,
      "midTier": 85,
      "lowTier": 50,
      "highPerformers": 23,
      "avgCtr": 0.032,
      "avgPosition": 18.5,
      "totalClicks": 5420,
      "totalImpressions": 185000
    },
    "localeSummary": {
      "en": { ... },
      "ja": { ... }
    },
    "topPerformers": [
      {
        "gsc_clicks": 245,
        "gsc_ctr": 0.058,
        "blog_posts": {
          "title": "Korean Rhinoplasty Cost Guide 2026",
          "slug": "korean-rhinoplasty-cost"
        }
      }
    ],
    "tierDistribution": {
      "top": 15,
      "mid": 85,
      "low": 50
    }
  }
}
```

### 5.2 POST /api/performance

GSC 데이터 수집 실행 (관리자 전용)

**Request:**
```json
{
  "daysAgo": 28
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pagesProcessed": 150,
    "newRecords": 45,
    "updatedRecords": 105,
    "highPerformers": 23
  },
  "message": "Processed 150 pages, found 23 high performers"
}
```

### 5.3 GET /api/performance/[id]

특정 포스트 성과 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid",
      "title": "Korean Rhinoplasty Cost Guide",
      "slug": "korean-rhinoplasty-cost",
      "locale": "en"
    },
    "latestPerformance": {
      "gsc_clicks": 245,
      "gsc_impressions": 4200,
      "gsc_ctr": 0.058,
      "gsc_position": 8.2,
      "performance_tier": "top",
      "is_high_performer": true
    },
    "history": [
      { "gsc_clicks": 180, "date_range_end": "2026-01-15" },
      { "gsc_clicks": 245, "date_range_end": "2026-01-22" }
    ]
  }
}
```

### 5.4 GET /api/cron/gsc-collect

일일 자동 수집 (Cron Job)

**Headers:**
- `Authorization: Bearer {CRON_SECRET}`

**Response:**
```json
{
  "success": true,
  "data": {
    "collection": {
      "pagesProcessed": 150,
      "newRecords": 45,
      "updatedRecords": 105,
      "highPerformers": 23
    },
    "learning": {
      "processed": 23,
      "indexed": 5
    }
  }
}
```

---

## 6. 학습 파이프라인 연동

### 6.1 파일: `learning-integration.ts`

#### 주요 함수

```typescript
// 고성과 콘텐츠 분석 및 학습
analyzeAndLearnFromHighPerformers(supabase): Promise<LearningIntegrationResult>

// 성과 등급 변동 감지
detectTierChanges(supabase): Promise<HighPerformerAnalysis[]>
```

#### 학습 플로우

```
1. 고성과 콘텐츠 조회 (is_high_performer = true)
       ↓
2. 이미 학습된 콘텐츠 제외
       ↓
3. 성과 점수 계산 (calculatePerformanceScore)
       ↓
4. 콘텐츠 분석 (analyzeHighPerformerContent)
       ↓
5. 학습 데이터 생성 (LearningData)
       ↓
6. Upstash Vector 인덱싱
       ↓
7. llm_learning_data 테이블 저장
```

#### 성과 점수 계산

```typescript
// 0-100점 척도
const ctrScore = Math.min(metrics.ctr * 1000, 30);      // max 30점
const clickScore = Math.min(metrics.clicks / 10, 25);   // max 25점
const positionScore = Math.max(0, 25 - metrics.position); // max 25점
const impressionScore = Math.min(metrics.impressions / 500, 20); // max 20점
```

---

## 7. Vercel Cron 설정

### 7.1 vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/gsc-collect",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### 7.2 환경 변수

```bash
CRON_SECRET=your-secure-random-string
```

---

## 8. DB 스키마

### 8.1 cron_logs

```sql
CREATE TABLE cron_logs (
    id UUID PRIMARY KEY,
    job_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'running', 'completed', 'failed'
    result_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ
);
```

### 8.2 performance_alerts

```sql
CREATE TABLE performance_alerts (
    id UUID PRIMARY KEY,
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id),
    alert_type TEXT NOT NULL, -- 'tier_upgrade', 'tier_downgrade', 'high_performer', 'position_change'
    previous_value TEXT,
    current_value TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ
);
```

---

## 9. 사용 방법

### 9.1 수동 데이터 수집

```bash
# API 호출 (관리자 인증 필요)
curl -X POST /api/performance \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"daysAgo": 28}'
```

### 9.2 성과 조회

```typescript
// 전체 요약
const response = await fetch('/api/performance?days=28&byLocale=true');
const { data } = await response.json();

console.log(data.summary.highPerformers); // 23
console.log(data.localeSummary.en.avgCtr); // 0.045

// 개별 포스트
const postResponse = await fetch(`/api/performance/${postId}`);
const { data: postData } = await postResponse.json();

console.log(postData.latestPerformance.performance_tier); // 'top'
```

### 9.3 GSC OAuth 설정 가이드

1. Google Cloud Console에서 프로젝트 생성
2. Search Console API 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. OAuth 동의 화면 설정
5. Refresh Token 발급 (OAuth Playground 사용)
6. 환경 변수 설정

---

## 10. 향후 작업

### 10.1 Phase 6 연동 (이미지 생성)

- 고성과 콘텐츠의 이미지 스타일 분석
- 이미지 프롬프트 자동 개선

### 10.2 알림 시스템

- 랭킹 변동 Slack/Email 알림
- 고성과 달성 시 알림

### 10.3 대시보드 UI

- 성과 시각화 차트
- 트렌드 분석

---

## 11. 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-22 | 초기 구현 - GSC 클라이언트, 데이터 수집기, API, 학습 연동 |

---

## 12. 관련 문서

- [PHASE4_IMPLEMENTATION.md](./PHASE4_IMPLEMENTATION.md) - LLM 자가 학습 시스템
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - 전체 로드맵
