# Review System

## Overview

병원, 의사, 통역사에 대한 리뷰 시스템입니다. 인증된 예약 후 리뷰 작성이 가능하며, 사진 첨부를 지원합니다.

## Key Features

- **리뷰 작성**: 1-5점 평점 + 텍스트 리뷰
- **사진 첨부**: 시술 전후 사진 (선택)
- **인증 리뷰**: 실제 예약 완료 후 작성
- **AI 요약**: 리뷰 요약 자동 생성 (계획)
- **스팸 필터링**: 관리자 승인 워크플로우

## File Structure

```
/src/app/api/reviews
├── route.ts              # GET (목록), POST (생성)
└── [id]/route.ts         # GET, PUT, DELETE (개별)
```

## API Endpoints

### GET /api/reviews
리뷰 목록 조회

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| hospitalId | uuid | 병원 필터 |
| doctorId | uuid | 의사 필터 |
| interpreterId | uuid | 통역사 필터 |
| minRating | number | 최소 평점 |
| status | string | pending, approved, rejected |
| page | number | 페이지 번호 |
| limit | number | 페이지당 항목 |

### POST /api/reviews
리뷰 작성 (인증 필요)

**Request Body:**
```json
{
  "hospital_id": "uuid (optional)",
  "doctor_id": "uuid (optional)",
  "interpreter_id": "uuid (optional)",
  "booking_id": "uuid (optional)",
  "rating": 5,
  "title": "Amazing experience!",
  "content": "Detailed review content...",
  "photos": ["url1", "url2"],
  "procedure_type": "Rhinoplasty",
  "visit_date": "2024-01-15"
}
```

## Database Schema

### reviews 테이블
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  hospital_id UUID REFERENCES hospitals(id),
  doctor_id UUID REFERENCES doctors(id),
  interpreter_id UUID REFERENCES interpreters(id),
  booking_id UUID REFERENCES bookings(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  photos TEXT[],
  procedure_type TEXT,
  visit_date DATE,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Review Workflow

```
작성 → pending → 관리자 검토 → approved/rejected
                    ↓
              is_featured (선택)
```

### 자동 검증
- booking_id가 있고 해당 예약이 'completed' 상태면 is_verified = true
- 인증된 리뷰는 더 높은 가중치

## Rating Aggregation

```sql
-- 병원 평균 평점 업데이트 트리거
CREATE OR REPLACE FUNCTION update_hospital_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hospitals
  SET avg_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE hospital_id = NEW.hospital_id
    AND status = 'approved'
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews
    WHERE hospital_id = NEW.hospital_id
    AND status = 'approved'
  )
  WHERE id = NEW.hospital_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Review Display

### Hospital Detail Page
- 전체 평점 표시
- 최근 10개 리뷰
- 평점별 분포 차트
- "더 보기" 페이지네이션

### Review Card
- 작성자 이름 (마스킹)
- 평점 (별점)
- 시술 유형
- 방문 날짜
- 리뷰 내용
- 첨부 사진 (클릭 확대)
- 인증 배지 (verified)

## Moderation

### 자동 필터링
- 금지어 목록 검사
- 스팸 패턴 탐지
- 중복 리뷰 방지 (같은 예약에 1개만)

### 관리자 기능
- 리뷰 승인/거부
- 특징 리뷰 지정 (featured)
- 부적절한 리뷰 숨김

## Future Improvements

- [ ] AI 기반 리뷰 요약
- [ ] 감성 분석
- [ ] 사진 자동 모더레이션
- [ ] 리뷰어 신뢰도 점수

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0.0 | Initial review system (partial) |
