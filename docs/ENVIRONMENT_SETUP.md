# GetCareKorea 환경 변수 설정 가이드

> 마지막 업데이트: 2026-01-22
> 버전: 1.0

---

## 목차

1. [필수 환경 변수](#1-필수-환경-변수)
2. [Supabase 설정](#2-supabase-설정)
3. [AI/LLM 서비스](#3-aillm-서비스)
4. [Upstash (Redis & Vector)](#4-upstash-redis--vector)
5. [Google Search Console](#5-google-search-console)
6. [이미지 생성 (나노바나나)](#6-이미지-생성-나노바나나)
7. [자동화 & 보안](#7-자동화--보안)
8. [개발 환경 설정](#8-개발-환경-설정)
9. [체크리스트](#9-체크리스트)

---

## 1. 필수 환경 변수

### 전체 환경 변수 목록

```bash
# ============================================
# Supabase (필수)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# AI Services (필수)
# ============================================
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# ============================================
# Upstash (선택 - 콘텐츠 자동화 사용 시 필수)
# ============================================
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
UPSTASH_VECTOR_REST_URL=https://your-vector.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your-vector-token

# ============================================
# Google Search Console (선택 - 성과 추적 시 필수)
# ============================================
GSC_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GSC_CLIENT_SECRET=your-google-client-secret
GSC_REFRESH_TOKEN=your-refresh-token
GSC_SITE_URL=https://getcarekorea.com

# ============================================
# 이미지 생성 (선택)
# ============================================
NANOBANANA_API_KEY=your-nanobanana-api-key

# ============================================
# 자동화 & 보안
# ============================================
CRON_SECRET=your-cron-secret
REVALIDATION_SECRET=your-revalidation-secret
NEXT_PUBLIC_SITE_URL=https://getcarekorea.com
```

---

## 2. Supabase 설정

### 2.1 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. 프로젝트 이름 및 데이터베이스 비밀번호 설정
4. 리전 선택 (Seoul 권장)

### 2.2 API 키 확인

1. Settings → API 메뉴
2. 다음 값들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (비공개!)

### 2.3 데이터베이스 마이그레이션

```bash
# 모든 마이그레이션 파일 실행
cd supabase/migrations
# Supabase 대시보드의 SQL Editor에서 각 파일 실행
# 순서: 001 → 002 → 003 → 004 → 005 → 006 → 007
```

### 2.4 Storage 버킷 생성

1. Supabase Dashboard → Storage
2. "New Bucket" → "blog-images" 생성
3. Public bucket 활성화
4. RLS 정책 설정 (관리자만 업로드)

---

## 3. AI/LLM 서비스

### 3.1 Anthropic (Claude)

1. [Anthropic Console](https://console.anthropic.com/) 접속
2. API Keys → Create Key
3. 복사하여 `ANTHROPIC_API_KEY`에 설정

**예상 비용:**
- Claude Sonnet 4: $3/1M input tokens, $15/1M output tokens
- 1개 포스트 생성 ≈ $0.05-0.10

### 3.2 OpenAI (Embeddings)

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. API Keys → Create new secret key
3. 복사하여 `OPENAI_API_KEY`에 설정

**예상 비용:**
- text-embedding-3-small: $0.02/1M tokens
- 1개 포스트 임베딩 ≈ $0.001

---

## 4. Upstash (Redis & Vector)

### 4.1 Redis 설정

1. [Upstash Console](https://console.upstash.com/) 접속
2. Redis → Create Database
3. 리전: Seoul 또는 Tokyo
4. REST API 탭에서:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

**용도:** 콘텐츠 생성 큐, 알림 시스템

### 4.2 Vector 설정

1. Vector → Create Index
2. Dimensions: **1536** (OpenAI embeddings)
3. Similarity: **Cosine**
4. REST API 탭에서:
   - **UPSTASH_VECTOR_REST_URL**
   - **UPSTASH_VECTOR_REST_TOKEN**

**용도:** LLM 자가 학습 (RAG), 고성과 콘텐츠 검색

---

## 5. Google Search Console

### 5.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. APIs & Services → Enable APIs:
   - Search Console API
   - Google Analytics API (선택)

### 5.2 OAuth 자격 증명 생성

1. APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: Web application
4. Authorized redirect URIs: `https://developers.google.com/oauthplayground`
5. 생성된 값 복사:
   - **GSC_CLIENT_ID**
   - **GSC_CLIENT_SECRET**

### 5.3 Refresh Token 획득

1. [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) 접속
2. 설정 (톱니바퀴 아이콘):
   - ✅ Use your own OAuth credentials
   - Client ID / Secret 입력
3. Step 1: Select & authorize APIs
   - `https://www.googleapis.com/auth/webmasters.readonly` 선택
4. Step 2: Exchange authorization code for tokens
5. Refresh token 복사 → **GSC_REFRESH_TOKEN**

### 5.4 사이트 URL 확인

**GSC_SITE_URL** 형식:
- HTTPS 사이트: `https://getcarekorea.com`
- HTTP 사이트: `http://getcarekorea.com`
- 도메인 속성: `sc-domain:getcarekorea.com`

---

## 6. 이미지 생성 (나노바나나)

### 6.1 API 키 발급

1. 나노바나나 API 문서 확인
2. API 키 발급 요청
3. `NANOBANANA_API_KEY`에 설정

### 6.2 이미지 사양

| 항목 | 값 |
|-----|---|
| 기본 크기 | 1200 x 630 (OG Image) |
| 포맷 | JPEG/PNG |
| 스타일 | photorealistic |

---

## 7. 자동화 & 보안

### 7.1 CRON_SECRET

Vercel Cron Job 인증용:

```bash
# 랜덤 시크릿 생성
openssl rand -hex 32
# 결과를 CRON_SECRET에 설정
```

### 7.2 REVALIDATION_SECRET

ISR 재검증 API 인증용:

```bash
# 랜덤 시크릿 생성
openssl rand -hex 32
# 결과를 REVALIDATION_SECRET에 설정
```

### 7.3 Vercel Cron 설정

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/gsc-collect",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "0/15 * * * *"
    }
  ]
}
```

---

## 8. 개발 환경 설정

### 8.1 로컬 환경 파일

`.env.local` 파일 생성:

```bash
# 파일 복사
cp .env.example .env.local

# 값 입력
nano .env.local
```

### 8.2 Vercel 환경 변수

1. Vercel Dashboard → Project → Settings → Environment Variables
2. 모든 환경 변수 추가
3. Production / Preview / Development 선택

### 8.3 환경별 설정

| 환경 | NEXT_PUBLIC_SITE_URL |
|-----|---------------------|
| Production | `https://getcarekorea.com` |
| Preview | `https://preview.getcarekorea.com` |
| Development | `http://localhost:3000` |

---

## 9. 체크리스트

### 필수 (최소 동작)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ANTHROPIC_API_KEY`

### 콘텐츠 자동화

- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `OPENAI_API_KEY` (임베딩용)

### LLM 자가 학습

- [ ] `UPSTASH_VECTOR_REST_URL`
- [ ] `UPSTASH_VECTOR_REST_TOKEN`

### 성과 추적 (GSC)

- [ ] `GSC_CLIENT_ID`
- [ ] `GSC_CLIENT_SECRET`
- [ ] `GSC_REFRESH_TOKEN`
- [ ] `GSC_SITE_URL`

### 이미지 생성

- [ ] `NANOBANANA_API_KEY`

### 자동화

- [ ] `CRON_SECRET`
- [ ] `REVALIDATION_SECRET`
- [ ] `NEXT_PUBLIC_SITE_URL`

---

## 문제 해결

### Supabase 연결 오류

```
Error: Invalid API key
```
→ `SUPABASE_SERVICE_ROLE_KEY` 확인

### Redis 연결 오류

```
Error: UPSTASH_REDIS_REST_URL is not defined
```
→ 환경 변수 설정 확인, 서버 재시작

### GSC 인증 오류

```
Error: invalid_grant
```
→ Refresh token 재발급 필요

### 이미지 생성 실패

```
Error: NANOBANANA_API_KEY is not configured
```
→ API 키 확인, 크레딧 잔액 확인

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-22 | 1.0 | 초기 문서 작성 |
