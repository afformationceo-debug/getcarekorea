# AI Chat System

## Overview

Claude AI 기반의 의료 관광 상담 챗봇입니다. RAG(Retrieval-Augmented Generation)를 통해 실제 병원/시술 데이터를 기반으로 정확한 답변을 제공합니다.

## Key Features

- **AI 상담**: Claude Sonnet 4 기반 자연어 대화
- **RAG 통합**: 병원/시술 데이터 기반 맥락 제공
- **Tool Calling**: 병원 검색, 가격 조회, 문의 생성
- **스트리밍 응답**: 실시간 타이핑 효과
- **다국어 지원**: 7개 언어 자동 감지 및 응답

## File Structure

```
/src/app/api/chat
├── route.ts              # 채팅 API 엔드포인트
└── feedback/route.ts     # 피드백 수집 API

/src/components
└── ChatWidget.tsx        # 채팅 위젯 컴포넌트

/src/lib/upstash
├── vector.ts             # Vector DB (RAG)
└── redis.ts              # 대화 로그 저장
```

## API Endpoint

### POST /api/chat
AI 채팅 메시지 전송 (스트리밍 응답)

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "코 성형 가격이 얼마인가요?" }
  ],
  "locale": "ko",
  "sessionId": "optional-session-id"
}
```

**Response:** Server-Sent Events (SSE) 스트리밍

## AI Tools (Function Calling)

### 1. searchHospitals
병원 검색

```typescript
{
  name: "searchHospitals",
  parameters: {
    specialty: "string (optional)",
    city: "string (optional)",
    name: "string (optional)"
  }
}
```

### 2. getProcedureInfo
시술 정보 조회

```typescript
{
  name: "getProcedureInfo",
  parameters: {
    procedure: "string (required)",
    hospitalId: "string (optional)"
  }
}
```

### 3. createInquiry
문의 생성

```typescript
{
  name: "createInquiry",
  parameters: {
    name: "string (required)",
    email: "string (required)",
    phone: "string (optional)",
    procedure: "string (optional)",
    message: "string (required)"
  }
}
```

### 4. searchInterpreters
통역사 검색

```typescript
{
  name: "searchInterpreters",
  parameters: {
    language: "string (required)",
    specialty: "string (optional)"
  }
}
```

## System Prompt

```
You are GetCareKorea's AI medical tourism consultant.
You help international patients find the best hospitals,
interpreters, and procedures in Korea.

Guidelines:
- Be helpful, accurate, and professional
- Always provide price ranges, not exact prices
- Recommend consulting with the hospital for final quotes
- If unsure, offer to connect with a human consultant
- Respect user's language preference
- Never provide medical advice - only general information
```

## RAG Integration

Upstash Vector를 사용한 시맨틱 검색:

```typescript
// 병원 정보 검색
const results = await vectorIndex.query({
  vector: await embed(userQuery),
  topK: 5,
  includeMetadata: true,
  filter: { namespace: 'hospitals' }
});

// 컨텍스트 생성
const context = results.map(r => r.metadata.content).join('\n');
```

## Chat Widget Features

- 플로팅 버튼 (우측 하단)
- 확장/축소 애니메이션
- 메시지 히스토리
- 타이핑 인디케이터
- 피드백 버튼 (도움됨/안됨)
- 다크/라이트 모드 지원

## Database Schema

### chat_conversations 테이블
```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  session_id TEXT,
  locale TEXT DEFAULT 'en',
  messages JSONB NOT NULL DEFAULT '[]',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Anonymous | 20 requests | 1 minute |
| Authenticated | 60 requests | 1 minute |
| Premium | 120 requests | 1 minute |

## Feedback Collection

### POST /api/chat/feedback
```json
{
  "sessionId": "session-123",
  "messageId": "msg-456",
  "helpful": true,
  "comment": "optional feedback"
}
```

## Performance

- 스트리밍으로 첫 토큰 1.5초 내 응답
- 최대 5 tool call 스텝
- 대화 컨텍스트 최적화 (최근 10개 메시지)

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0.0 | Initial AI chat system |
