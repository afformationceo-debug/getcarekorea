# Admin Dashboard

## Overview

플랫폼 관리자를 위한 대시보드입니다. 핵심 지표 모니터링, 문의 관리, 콘텐츠 관리 기능을 제공합니다.

## Key Features

- **메트릭 대시보드**: 8개 핵심 지표 실시간 표시
- **문의 관리**: 상태별 필터링, 담당자 배정
- **콘텐츠 관리**: 키워드 관리, AI 콘텐츠 생성
- **블로그 성과**: 조회수 상위 콘텐츠 표시

## File Structure

```
/src/app/[locale]/admin
├── page.tsx              # 메인 대시보드
└── keywords/
    └── page.tsx          # 키워드 관리 페이지
```

## Dashboard Metrics

8개 핵심 지표를 실시간 표시:

| 지표 | 아이콘 | 설명 |
|------|--------|------|
| Total Hospitals | Building2 | 등록된 병원 수 |
| Active Interpreters | Users | 활성 통역사 수 |
| New Inquiries | MessageSquare | 새 문의 (new 상태) |
| Published Articles | FileText | 발행된 블로그 포스트 |
| Total Bookings | Calendar | 전체 예약 수 |
| Chat Sessions | MessageCircle | 채팅 세션 수 |
| Average Rating | Star | 병원 평균 평점 |
| Total Views | TrendingUp | 블로그 총 조회수 |

## Data Fetching

Supabase 병렬 쿼리로 성능 최적화:

```typescript
const [
  hospitalsResult,
  interpretersResult,
  inquiriesResult,
  articlesResult,
  bookingsResult,
  chatsResult,
  ratingsResult,
  viewsResult
] = await Promise.all([
  supabase.from('hospitals').select('*', { count: 'exact', head: true }),
  supabase.from('interpreters').select('*', { count: 'exact', head: true }).eq('is_available', true),
  supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
  supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
  supabase.from('bookings').select('*', { count: 'exact', head: true }),
  supabase.from('chat_conversations').select('*', { count: 'exact', head: true }),
  supabase.from('hospitals').select('avg_rating').not('avg_rating', 'is', null),
  supabase.from('blog_posts').select('view_count').eq('status', 'published')
]);
```

## Recent Inquiries Section

### 기능
- 최근 5개 문의 표시
- 상태별 배지 (New, In Progress, Resolved, Closed)
- 이름, 이메일, 시술 관심사, 생성 시간
- 전체 보기 링크

### 상태별 색상
| Status | 색상 |
|--------|------|
| new | Red |
| in_progress | Yellow |
| resolved | Green |
| closed | Gray |

## Content Performance Section

상위 5개 블로그 포스트 표시:
- 제목 (로케일 기반)
- 카테고리
- 조회수
- 발행일

## Keyword Management

`/admin/keywords` 페이지 기능:

### 키워드 관리
- 키워드 추가/수정/삭제
- 카테고리 분류
- 우선순위 설정
- 상태 필터링 (pending, generating, generated, published)

### AI 콘텐츠 생성
- 키워드 선택 후 "Generate Content" 클릭
- 다국어 번역 옵션
- 미리보기 모드
- 품질 점수 확인
- 데이터베이스 저장

### CSV Import
대량 키워드 업로드:
```csv
keyword,category,locale,search_volume,competition,priority
best rhinoplasty korea,plastic-surgery,en,12000,0.65,1
korea dental implants,dental,en,8500,0.45,2
```

## Access Control

| Role | 접근 가능 기능 |
|------|---------------|
| admin | 모든 기능 |
| hospital_admin | 소속 병원 관련 데이터만 |
| interpreter | 접근 불가 |
| patient | 접근 불가 |

## UI Components

- **MetricCard**: 아이콘, 라벨, 값, 변화율
- **InquiryTable**: 문의 목록 테이블
- **ArticleList**: 콘텐츠 성과 목록
- **KeywordManager**: 키워드 관리 인터페이스
- **ContentPreview**: AI 생성 콘텐츠 미리보기

## Future Improvements

- [ ] 실시간 대시보드 (WebSocket)
- [ ] 맞춤형 리포트 생성
- [ ] 알림 센터
- [ ] 권한 관리 UI
- [ ] 감사 로그

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0.0 | Initial admin dashboard |
