# Booking & Inquiry System

## Overview

예약 및 문의 관리 시스템입니다. 환자가 병원 예약을 신청하고, 일반 문의를 제출할 수 있습니다.

## Key Features

### Booking (예약)
- 병원/시술/의사 예약 신청
- 통역사 동반 예약
- 상태 추적: pending → confirmed → completed
- 역할별 접근 제어

### Inquiry (문의)
- 일반 문의 제출 (비회원 가능)
- 다양한 메신저 연동 (WhatsApp, LINE, WeChat, Telegram)
- 관리자 대시보드에서 처리
- 자동 24시간 응답 약속

## File Structure

```
/src/app/[locale]/inquiry
└── page.tsx                    # 문의 폼 페이지

/src/app/api
├── /bookings
│   ├── route.ts                # GET (목록), POST (생성)
│   └── [id]/route.ts           # GET, PUT, DELETE (개별)
└── /inquiries
    ├── route.ts                # GET (목록), POST (생성)
    └── [id]/route.ts           # GET, PUT (개별)

/src/lib/notifications
└── index.ts                    # 알림 발송 유틸리티
```

## Booking API

### GET /api/bookings
예약 목록 조회 (인증 필요)

**역할별 접근:**
| Role | 접근 범위 |
|------|----------|
| admin | 모든 예약 |
| hospital_admin | 소속 병원 예약 |
| interpreter | 배정된 예약 |
| patient | 본인 예약 |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | 페이지 번호 |
| limit | number | 페이지당 항목 |
| status | string | pending, confirmed, completed, cancelled |

### POST /api/bookings
예약 생성 (인증 필요)

**Request Body:**
```json
{
  "hospital_id": "uuid",
  "procedure_id": "uuid (optional)",
  "doctor_id": "uuid (optional)",
  "interpreter_id": "uuid (optional)",
  "booking_date": "2024-02-15",
  "booking_time": "10:00 (optional)",
  "notes": "Special requests",
  "total_price": 5000
}
```

**Validation:**
- 예약일은 미래 날짜여야 함
- 병원 존재 여부 확인
- 통역사 가용성 확인 (선택 시)

### PUT /api/bookings/[id]
예약 수정

**가능한 상태 변경:**
- patient: pending → cancelled
- hospital_admin: pending → confirmed, confirmed → completed
- admin: 모든 상태 변경

### DELETE /api/bookings/[id]
예약 취소

## Inquiry API

### POST /api/inquiries
문의 제출 (공개, 비회원 가능)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890 (optional)",
  "messenger_type": "whatsapp",
  "messenger_id": "+1234567890",
  "procedure_interest": "Rhinoplasty",
  "message": "I'm interested in...",
  "hospital_id": "uuid (optional)",
  "source": "website",
  "utm_source": "google",
  "utm_medium": "cpc"
}
```

**보안:**
- 이메일 형식 검증
- XSS 방지 (HTML 이스케이프)
- Rate limiting (10 requests/minute)

### GET /api/inquiries
문의 목록 조회 (admin, hospital_admin만)

## Inquiry Form Features

- 필수 정보: 이름, 이메일
- 선택 정보: 전화, 메신저
- 시술 관심사: 9개 카테고리 선택
  - 성형외과, 피부과, 치과, 안과
  - 헤어, 건강검진, 정형외과, 생식의학, 기타
- 메신저 타입별 ID 입력:
  - WhatsApp: 전화번호
  - LINE: LINE ID
  - WeChat: WeChat ID
  - Telegram: @username
  - Email: 이메일 주소

## Database Schema

### bookings 테이블
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  hospital_id UUID REFERENCES hospitals(id),
  interpreter_id UUID REFERENCES interpreters(id),
  procedure_id UUID REFERENCES procedures(id),
  doctor_id UUID REFERENCES doctors(id),
  booking_date DATE NOT NULL,
  booking_time TIME,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  total_price INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### inquiries 테이블
```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  hospital_id UUID REFERENCES hospitals(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  messenger_type TEXT,
  messenger_id TEXT,
  procedure_interest TEXT,
  message TEXT,
  locale TEXT DEFAULT 'en',
  status TEXT DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id),
  communication_log JSONB DEFAULT '[]',
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Notification System

예약/문의 시 자동 알림:

```typescript
// 새 예약 알림
await sendNotification({
  type: 'booking_created',
  recipientId: hospitalAdminId,
  data: { bookingId, patientName, date }
});

// 새 문의 알림
await sendNotification({
  type: 'inquiry_received',
  recipientId: adminId,
  data: { inquiryId, name, procedure }
});
```

## Status Flow

### Booking Status
```
pending → confirmed → completed
    ↓
cancelled
```

### Inquiry Status
```
new → in_progress → resolved → closed
```

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0.0 | Initial booking/inquiry system |
