# Project Setup

## Overview

GetCareKorea 프로젝트의 초기 설정 및 기술 스택 구성입니다.

## Technical Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 15 | App Router, SSR/SSG, React Server Components |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | v4 | Utility-first CSS |
| UI Components | shadcn/ui | latest | Accessible components |
| Animation | Framer Motion | latest | Page transitions, micro-interactions |
| State | Zustand + TanStack Query | - | Client + server state |
| i18n | next-intl | latest | 7-language support |
| Database | Supabase | - | PostgreSQL, Auth, RLS |
| Cache | Upstash Redis | - | Sessions, rate limiting |
| Vector DB | Upstash Vector | - | RAG, semantic search |
| LLM | Anthropic Claude | Sonnet 4 | Content generation, chat |
| Embedding | OpenAI | text-embedding-3-small | Vector embeddings |

## Project Structure

```
/src
├── /app
│   ├── /[locale]           # i18n routing (7 languages)
│   │   ├── page.tsx        # Landing page
│   │   ├── /hospitals      # Hospital pages
│   │   ├── /interpreters   # Interpreter pages
│   │   ├── /blog           # Blog pages
│   │   ├── /inquiry        # Inquiry form
│   │   ├── /auth           # Authentication
│   │   └── /admin          # Admin dashboard
│   └── /api                # API routes
├── /components
│   ├── /ui                 # shadcn/ui components
│   └── /landing            # Landing page sections
├── /lib
│   ├── /supabase           # Database clients
│   ├── /upstash            # Redis & Vector
│   ├── /i18n               # Internationalization
│   ├── /content            # Content generation
│   ├── /cache              # Caching utilities
│   ├── /api                # API error handling
│   └── /db                 # Schema & RLS
└── /messages               # Translation files
```

## Supported Languages

| Code | Language | CTA Platform | Currency |
|------|----------|--------------|----------|
| en | English | WhatsApp | USD |
| zh-TW | Traditional Chinese | LINE | TWD |
| zh-CN | Simplified Chinese | WeChat | CNY |
| ja | Japanese | LINE | JPY |
| th | Thai | LINE | THB |
| mn | Mongolian | WhatsApp | MNT |
| ru | Russian | WhatsApp/Telegram | RUB |

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Upstash Vector
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=

# Anthropic
ANTHROPIC_API_KEY=

# OpenAI (for embeddings)
OPENAI_API_KEY=
```

## Installation

```bash
# Clone repository
git clone <repo-url>
cd getcarekorea

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Fill in environment variables

# Run development server
npm run dev
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS settings |
| `tsconfig.json` | TypeScript configuration |
| `middleware.ts` | i18n routing middleware |
| `src/lib/i18n/config.ts` | Language & locale settings |

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0.0 | Initial project setup |
