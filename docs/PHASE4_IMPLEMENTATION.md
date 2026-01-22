# Phase 4: LLM 자가 학습 시스템 - 구현 문서

> 완료일: 2026-01-22
> 버전: 1.0

---

## 1. 개요

Phase 4에서는 콘텐츠 성과 기반의 자가 학습 시스템을 구현했습니다.

### 1.1 주요 목표
- 고성과 콘텐츠 자동 감지
- 패턴 분석 및 학습 데이터 생성
- Upstash Vector 인덱싱
- 관리자 피드백 기반 학습
- 새 콘텐츠 생성 시 학습 데이터 참조

### 1.2 학습 데이터 소스
1. **high_performer**: GSC 성과 데이터 기반 자동 감지
2. **manual_edit**: 관리자가 직접 수정한 콘텐츠
3. **user_feedback**: 관리자 긍정적 피드백

---

## 2. 구현된 파일 구조

```
src/lib/content/
├── learning-rag.ts              # Phase 3에서 구현 (기본 구조)
├── learning-pipeline.ts         # 학습 파이프라인 (NEW)
├── generator-v3.ts              # 통합 생성기 v3 (NEW)
└── prompts/
    └── ... (Phase 3)

src/app/api/learning/
├── route.ts                     # 학습 파이프라인 API (NEW)
└── feedback/
    └── route.ts                 # 피드백 API (NEW)

supabase/migrations/
└── 004_llm_learning_system.sql  # DB 마이그레이션 (NEW)
```

---

## 3. 학습 파이프라인

### 3.1 파일: `learning-pipeline.ts`

#### 주요 함수

```typescript
// 고성과 콘텐츠 감지
detectHighPerformers(supabase, options): Promise<BlogPostWithPerformance[]>

// 학습 파이프라인 실행
runLearningPipeline(supabase): Promise<LearningPipelineResult>

// 관리자 피드백 처리
processManualFeedback(supabase, feedback): Promise<{success, learningDataId?, error?}>

// 파이프라인 상태 조회
getLearningPipelineStatus(): Promise<{lastRun, totalProcessed, totalHighPerformers}>
```

#### 고성과 콘텐츠 기준

| 메트릭 | 기준값 | 설명 |
|--------|-------|------|
| CTR | ≥ 3% | 클릭률 |
| Clicks | ≥ 50 | 최소 클릭수 |
| Position | ≤ 20 | 상위 20위 이내 |
| Impressions | ≥ 500 | 최소 노출수 |

#### 성과 점수 계산

```typescript
// 가중치 기반 점수 (0-100)
const ctrScore = Math.min(metrics.ctr * 1000, 30);      // max 30점
const clickScore = Math.min(metrics.clicks / 10, 25);   // max 25점
const positionScore = Math.max(0, 25 - metrics.position); // max 25점
const conversionScore = Math.min(metrics.conversions * 5, 20); // max 20점
```

### 3.2 학습 플로우

```
1. detectHighPerformers() - 고성과 콘텐츠 감지
       ↓
2. analyzeContent() - 콘텐츠 분석 (title pattern, writing style, SEO patterns)
       ↓
3. createLearningDataFromPost() - 학습 데이터 생성
       ↓
4. indexLearningData() - Upstash Vector 인덱싱
       ↓
5. saveLearningDataToDB() - DB 저장
       ↓
6. Redis 처리 완료 표시
```

---

## 4. API 명세

### 4.1 GET /api/learning

학습 파이프라인 상태 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "status": {
      "lastRun": "2026-01-22T10:00:00Z",
      "totalProcessed": 150,
      "totalHighPerformers": 23
    },
    "recentLearning": [
      {
        "id": "learn_xxx",
        "source_type": "high_performer",
        "locale": "en",
        "category": "plastic-surgery",
        "performance_score": 85,
        "created_at": "2026-01-22T10:00:00Z"
      }
    ]
  }
}
```

### 4.2 POST /api/learning

학습 파이프라인 실행 (관리자 전용)

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 100,
    "newHighPerformers": 5,
    "indexed": 5,
    "errors": []
  },
  "message": "Processed 100 posts, found 5 new high performers, indexed 5"
}
```

### 4.3 POST /api/learning/feedback

관리자 피드백 제출

**Request:**
```json
{
  "blog_post_id": "uuid",
  "feedback_type": "positive" | "negative" | "edit",
  "edited_content": "수정된 콘텐츠 (edit일 때 필수)",
  "notes": "관리자 메모"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "learningDataId": "learn_edit_xxx",
    "feedbackType": "edit"
  },
  "message": "Feedback processed and learning data created"
}
```

---

## 5. Generator v3

### 5.1 파일: `generator-v3.ts`

Phase 3 프롬프트 시스템과 학습 RAG를 통합한 새 생성기입니다.

#### 주요 함수

```typescript
// 전체 기능 생성 (RAG + Learning)
generateBlogContentV3(options): Promise<{result, metadata}>

// 간단 생성 (RAG 없음, 빠른 속도)
generateBlogContentSimple(options): Promise<{result, metadata}>

// 품질 점수 v3 (통역사/플랫폼 정체성 포함)
scoreContentV3(content, keyword): QualityScoreV3

// 전체 파이프라인 v3
runContentPipelineV3(options, autoIndex): Promise<ContentPipelineResultV3>
```

### 5.2 품질 점수 v3

| 카테고리 | 가중치 | 평가 항목 |
|---------|-------|----------|
| SEO | 20% | 제목, 메타, 키워드 밀도 |
| AEO | 20% | Quick Answer, FAQ, 테이블 |
| E-E-A-T | 20% | 자격증, 통계, 면책조항 |
| Identity | 25% | 의료 주장 없음, 플랫폼 목소리 |
| Readability | 15% | 헤딩, 길이, CTA |

#### 통역사/플랫폼 정체성 평가

```typescript
// Identity Score (100점 만점)
noMedicalClaims: 40점  // 의료 전문가 사칭 없음
hasPlatformVoice: 30점 // "GetCareKorea", "our team" 등 사용
hasProperDisclaimer: 30점 // 정보 제공 목적 면책조항
```

---

## 6. DB 스키마

### 6.1 admin_feedback_logs

```sql
CREATE TABLE admin_feedback_logs (
    id UUID PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id),
    feedback_type TEXT NOT NULL, -- 'positive', 'negative', 'edit'
    notes TEXT,
    learning_data_id TEXT,
    created_at TIMESTAMPTZ
);
```

### 6.2 llm_learning_data

```sql
CREATE TABLE llm_learning_data (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL, -- 'high_performer', 'user_feedback', 'manual_edit'
    blog_post_id UUID,
    keyword_id UUID,
    content_excerpt TEXT,
    writing_style_notes TEXT,
    seo_patterns JSONB,
    locale TEXT,
    category TEXT,
    performance_score INTEGER,
    is_vectorized BOOLEAN,
    vector_id TEXT,
    created_at TIMESTAMPTZ
);
```

### 6.3 learning_pipeline_runs

```sql
CREATE TABLE learning_pipeline_runs (
    id UUID PRIMARY KEY,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT, -- 'running', 'completed', 'failed'
    posts_processed INTEGER,
    new_high_performers INTEGER,
    data_indexed INTEGER,
    errors JSONB,
    created_at TIMESTAMPTZ
);
```

---

## 7. 사용 방법

### 7.1 학습 파이프라인 실행

```bash
# API 호출 (관리자 인증 필요)
curl -X POST /api/learning \
  -H "Authorization: Bearer {token}"
```

### 7.2 피드백 제출

```typescript
// 긍정적 피드백
await fetch('/api/learning/feedback', {
  method: 'POST',
  body: JSON.stringify({
    blog_post_id: 'uuid',
    feedback_type: 'positive',
    notes: '좋은 콘텐츠'
  })
});

// 수정 피드백 (학습)
await fetch('/api/learning/feedback', {
  method: 'POST',
  body: JSON.stringify({
    blog_post_id: 'uuid',
    feedback_type: 'edit',
    edited_content: '수정된 콘텐츠...',
    notes: '제목 구조 개선'
  })
});
```

### 7.3 v3 생성기 사용

```typescript
import { runContentPipelineV3 } from '@/lib/content/generator-v3';

const result = await runContentPipelineV3({
  keyword: 'korean rhinoplasty cost',
  locale: 'en',
  category: 'plastic-surgery',
  includeRAG: true,
  includeLearning: true,
});

console.log(result.qualityScore.overall); // 85
console.log(result.qualityScore.identity); // 90 (정체성 준수)
```

---

## 8. 향후 작업

### 8.1 Phase 5 연동 (GSC)

- GSC API 연동 후 자동 성과 데이터 수집
- 일일 스케줄러로 학습 파이프라인 자동 실행

### 8.2 자동화

- Cron Job 또는 Vercel Cron으로 일일 학습 파이프라인 실행
- 고성과 콘텐츠 감지 시 Slack/Email 알림

---

## 9. 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-22 | 초기 구현 - 파이프라인, API, Generator v3 |

---

## 10. 관련 문서

- [PHASE3_IMPLEMENTATION.md](./PHASE3_IMPLEMENTATION.md) - 프롬프트 시스템
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - 전체 로드맵
