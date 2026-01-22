# Authentication System

## Overview

Supabase Auth 기반의 인증 시스템입니다. 이메일/비밀번호 로그인, 회원가입, OAuth 콜백을 지원합니다.

## Key Features

- **이메일 인증**: 이메일/비밀번호 기반 로그인
- **회원가입**: 새 사용자 등록
- **OAuth 지원**: 소셜 로그인 콜백 처리
- **역할 기반 접근 제어**: patient, interpreter, hospital_admin, admin
- **세션 관리**: Supabase 자동 세션 갱신

## File Structure

```
/src/app/[locale]/auth
├── login/page.tsx        # 로그인 페이지
├── signup/page.tsx       # 회원가입 페이지
└── callback/route.ts     # OAuth 콜백 핸들러

/src/lib/supabase
├── client.ts             # 클라이언트 사이드 Supabase
└── server.ts             # 서버 사이드 Supabase (SSR)
```

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| patient | 일반 환자/사용자 | 병원 조회, 문의 제출, 본인 예약 관리 |
| interpreter | 의료 통역사 | 본인 프로필 관리, 배정된 예약 조회 |
| hospital_admin | 병원 관리자 | 소속 병원 관리, 문의/예약 처리 |
| admin | 플랫폼 관리자 | 전체 시스템 관리, 콘텐츠 생성 |

## Login Page Features

- 이메일/비밀번호 입력
- 비밀번호 표시/숨김 토글
- "비밀번호 찾기" 링크
- 로딩 상태 표시
- 에러 메시지 다국어 지원
- 그라디언트 배경, 애니메이션 UI

## API Endpoints

### POST /api/auth/login
이메일/비밀번호 로그인

### POST /api/auth/signup
새 사용자 등록

### GET /[locale]/auth/callback
OAuth 제공자 콜백 처리

## Database Schema

### profiles 테이블
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'patient',
  locale TEXT DEFAULT 'en',
  phone TEXT,
  preferred_messenger TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security (RLS)

```sql
-- 사용자는 본인 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Usage Example

```typescript
// 클라이언트에서 로그인
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// 서버에서 세션 확인
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

## Security Considerations

- 비밀번호는 Supabase Auth에서 자동 해싱
- JWT 토큰 자동 갱신
- CSRF 보호 내장
- Rate limiting 적용

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0.0 | Initial authentication system |
