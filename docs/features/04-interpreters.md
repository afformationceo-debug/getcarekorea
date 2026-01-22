# Interpreter System

## Overview

의료 통역사 목록 조회, 프로필 상세, 검색 및 필터링 기능을 제공합니다. 실시간 가용성 확인과 예약 연동을 지원합니다.

## Key Features

- **통역사 목록**: 페이지네이션, 필터링, 정렬
- **프로필 상세**: 언어, 전문 분야, 요금, 리뷰
- **실시간 가용성**: Redis 기반 온라인 상태
- **스마트 매칭**: 언어, 전문 분야, 평점 기반
- **비디오 소개**: 통역사 소개 영상

## File Structure

```
/src/app/[locale]/interpreters
├── page.tsx                       # 통역사 목록 페이지
├── InterpretersPageClient.tsx     # 클라이언트 컴포넌트
└── [id]/page.tsx                  # 통역사 상세 페이지

/src/app/api/interpreters
├── route.ts                       # GET (목록)
└── [id]/route.ts                  # GET, PUT, DELETE (개별)

/src/components
└── InterpreterCard.tsx            # 통역사 카드 컴포넌트
```

## API Endpoints

### GET /api/interpreters
통역사 목록 조회

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| locale | string | en | 언어 코드 |
| page | number | 1 | 페이지 번호 |
| limit | number | 10 | 페이지당 항목 |
| language | string | - | 통역 가능 언어 |
| specialty | string | - | 전문 분야 |
| minRating | number | - | 최소 평점 |
| maxRate | number | - | 최대 시간당 요금 |
| available | boolean | - | 현재 가용 여부 |
| sortBy | string | avg_rating | 정렬 필드 |
| sortOrder | string | desc | 정렬 방향 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "profile_id": "uuid",
      "full_name": "Kim Minjun",
      "avatar_url": "https://...",
      "languages": ["Korean", "English", "Japanese"],
      "specialties": ["Plastic Surgery", "Dermatology"],
      "hourly_rate": 50,
      "daily_rate": 350,
      "avg_rating": 4.9,
      "review_count": 156,
      "total_bookings": 423,
      "is_verified": true,
      "is_available": true,
      "video_url": "https://..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 25, "hasMore": true }
}
```

### GET /api/interpreters/[id]
통역사 상세 조회 (리뷰 포함 옵션)

### PUT /api/interpreters/[id]
프로필 수정 (본인 또는 admin만)

### DELETE /api/interpreters/[id]
프로필 삭제 (admin만)

## Database Schema

### interpreters 테이블
```sql
CREATE TABLE interpreters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  languages TEXT[] NOT NULL,
  specialties TEXT[],
  -- 다국어 바이오
  bio_en TEXT,
  bio_zh_tw TEXT,
  bio_zh_cn TEXT,
  bio_ja TEXT,
  bio_th TEXT,
  bio_mn TEXT,
  bio_ru TEXT,
  photo_url TEXT,
  video_url TEXT,
  hourly_rate INTEGER,
  daily_rate INTEGER,
  availability JSONB,
  avg_rating DECIMAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Interpreter Card Features

- 프로필 사진
- 이름 및 검증 배지
- 통역 가능 언어 (플래그 아이콘)
- 전문 분야 태그
- 경력 년수
- 시간당/일당 요금
- 평점 및 리뷰 수
- 총 예약 완료 수
- 가용 상태 표시 (녹색/회색)
- "프로필 보기" 버튼

## Filtering Options

| Filter | Description |
|--------|-------------|
| Language | 영어, 일본어, 중국어, 태국어, 러시아어, 베트남어, 몽골어 |
| Specialty | 성형외과, 피부과, 치과, 안과, 건강검진 등 |
| Rating | 4.0+, 4.5+, 5.0 |
| Hourly Rate | $30 이하, $30-50, $50-80, $80+ |
| Availability | 현재 가용 여부 |

## Real-time Availability

Redis를 사용한 실시간 상태 관리:

```typescript
// 온라인 상태 설정
await redis.sadd('online:interpreters', interpreterId);

// 온라인 통역사 조회
const onlineInterpreters = await redis.smembers('online:interpreters');

// 오프라인 처리 (TTL 자동 만료)
await redis.setex(`interpreter:${id}:heartbeat`, 300, 'online');
```

## Sample Data

8명의 샘플 통역사:
- English/Japanese 전문
- Thai/English 전문
- Chinese (Traditional/Simplified)
- Russian/English 전문
- Vietnamese/English 전문
- Mongolian/English 전문

## Performance

- GIN 인덱스: languages, specialties 배열
- B-tree 인덱스: avg_rating, hourly_rate
- Profile 테이블 조인 최적화

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0.0 | Initial interpreter system |
