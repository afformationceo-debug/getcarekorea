# GetCareKorea API Reference

## Overview

All API endpoints are located at `/api/*`. The API uses JSON for request and response bodies.

## Authentication

Authentication is handled via Supabase Auth. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| BAD_REQUEST | 400 | Malformed request |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| DATABASE_ERROR | 500 | Database operation failed |

---

## Hospitals API

### List Hospitals

`GET /api/hospitals`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| locale | string | Language code (default: en) |
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 10, max: 50) |
| city | string | Filter by city |
| specialty | string | Filter by specialty |
| language | string | Filter by supported language |
| minRating | number | Minimum rating (1-5) |
| featured | boolean | Only featured hospitals |
| search | string | Search by name/description |
| sortBy | string | Sort field: avg_rating, review_count, name_en, created_at |
| sortOrder | string | asc or desc (default: desc) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "grand-plastic-surgery",
      "name": "Grand Plastic Surgery",
      "name_en": "Grand Plastic Surgery",
      "description": "...",
      "city": "Seoul",
      "specialties": ["Rhinoplasty", "Eye Surgery"],
      "languages": ["Korean", "English", "Chinese"],
      "avg_rating": 4.85,
      "review_count": 234,
      "is_featured": true,
      "is_verified": true
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 50, "hasMore": true }
}
```

### Get Hospital Detail

`GET /api/hospitals/[slug]`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| locale | string | Language code |
| includeDoctors | boolean | Include doctors list |
| includeProcedures | boolean | Include procedures list |
| includeReviews | boolean | Include reviews (limit 10) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "grand-plastic-surgery",
    "name": "Grand Plastic Surgery",
    "doctors": [...],
    "procedures": [...],
    "reviews": [...],
    "reviewCount": 234
  }
}
```

### Create Hospital (Admin)

`POST /api/hospitals`

**Request Body:**

```json
{
  "slug": "new-hospital",
  "name_en": "New Hospital",
  "name_zh_tw": "新醫院",
  "description_en": "...",
  "city": "Seoul",
  "specialties": ["General Surgery"],
  "languages": ["Korean", "English"]
}
```

**Response:** Hospital object

---

## Interpreters API

### List Interpreters

`GET /api/interpreters`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| locale | string | Language code |
| page | number | Page number |
| limit | number | Results per page |
| language | string | Filter by language |
| specialty | string | Filter by specialty |
| minRating | number | Minimum rating |
| maxRate | number | Maximum hourly rate |
| available | boolean | Only available interpreters |

### Get Interpreter Detail

`GET /api/interpreters/[id]`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| locale | string | Language code |
| includeReviews | boolean | Include reviews |

---

## Inquiries API

### Submit Inquiry (Public)

`POST /api/inquiries`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
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

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Thank you for your inquiry. We will contact you within 24 hours."
  }
}
```

### List Inquiries (Admin)

`GET /api/inquiries`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Results per page |
| status | string | Filter by status |
| hospitalId | string | Filter by hospital |

---

## Blog API

### List Blog Posts

`GET /api/blog`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| locale | string | Language code |
| page | number | Page number |
| limit | number | Results per page |
| category | string | Filter by category |
| tag | string | Filter by tag |
| search | string | Search by title/excerpt |

### Get Blog Post

`GET /api/blog/[slug]`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| locale | string | Language code |
| includeRelated | boolean | Include related posts (default: true) |

---

## Bookings API

### List Bookings (Authenticated)

`GET /api/bookings`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| locale | string | Language code |
| page | number | Page number |
| limit | number | Results per page |
| status | string | Filter by status (pending, confirmed, completed, cancelled) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "profile_id": "uuid",
      "hospital_id": "uuid",
      "booking_date": "2024-02-15",
      "booking_time": "10:00",
      "status": "confirmed",
      "hospitals": { "id": "uuid", "name_en": "...", "city": "Seoul" },
      "procedures": { ... },
      "interpreters": { ... }
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 5, "hasMore": false }
}
```

### Create Booking (Authenticated)

`POST /api/bookings`

**Request Body:**

```json
{
  "hospital_id": "uuid",
  "procedure_id": "uuid (optional)",
  "doctor_id": "uuid (optional)",
  "interpreter_id": "uuid (optional)",
  "booking_date": "2024-02-15",
  "booking_time": "10:00 (optional)",
  "notes": "Special requests (optional)",
  "total_price": 5000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "booking": { ... },
    "message": "Your booking request has been submitted..."
  }
}
```

### Get Booking Detail (Authenticated)

`GET /api/bookings/[id]`

### Update Booking (Authenticated)

`PUT /api/bookings/[id]`

**Request Body (varies by user role):**

```json
{
  "status": "confirmed",
  "booking_date": "2024-02-16",
  "booking_time": "14:00",
  "notes": "Updated notes"
}
```

### Cancel Booking (Authenticated)

`DELETE /api/bookings/[id]`

---

## Chat API

### Send Message

`POST /api/chat`

**Request Body:**

```json
{
  "messages": [
    { "role": "user", "content": "What are the best hospitals for rhinoplasty?" }
  ],
  "locale": "en",
  "sessionId": "optional-session-id"
}
```

**Response:** Streaming response (Server-Sent Events)

The chat API uses Claude AI with the following tools:
- `searchHospitals` - Search hospitals by specialty, city
- `getProcedureInfo` - Get procedure details and pricing
- `searchInterpreters` - Find available interpreters
- `createInquiry` - Help users submit inquiries

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat API | 20 requests | 1 minute |
| Inquiry API | 10 requests | 1 minute |
| Booking API | 30 requests | 1 minute |
| Search APIs | 60 requests | 1 minute |

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-20 | 1.1.0 | Added Bookings API, notification system |
| 2026-01-20 | 1.0.0 | Initial API release |
