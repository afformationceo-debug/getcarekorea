# GetCareKorea Architecture Overview

## Executive Summary
GetCareKorea is a medical tourism platform connecting international patients with Korean healthcare providers and medical interpreters. The platform features AI-powered assistance, multi-language support, and comprehensive hospital/interpreter discovery.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 App Router (React 19 Server Components)            │
│  - SSR/SSG for SEO optimization                                 │
│  - Streaming for AI responses                                   │
│  - i18n routing for 7 languages                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes                                             │
│  - /api/chat - AI chat with streaming                           │
│  - /api/content/generate - Content generation                   │
│  - /api/inquiry - Inquiry submission                            │
│  - /api/hospitals - Hospital CRUD                               │
│  - /api/interpreters - Interpreter matching                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Supabase   │  │   Upstash    │  │  Anthropic   │          │
│  │  PostgreSQL  │  │    Redis     │  │    Claude    │          │
│  │     Auth     │  │   Vector     │  │   OpenAI     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15 (App Router) | SSR/SSG, React Server Components |
| Language | TypeScript 5.x | Type safety |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first styling |
| Animation | Framer Motion | Page transitions, micro-interactions |
| State | Zustand + TanStack Query | Client state + server state |
| i18n | next-intl | 7-language support |
| Database | Supabase (PostgreSQL) | Relational data, RLS, Auth |
| Cache | Upstash Redis | Sessions, rate limiting, caching |
| Vector DB | Upstash Vector | RAG, semantic search |
| LLM | Anthropic Claude | Content generation, chat |
| Embedding | OpenAI text-embedding-3-small | Vector embeddings |

## Supported Languages

| Code | Language | Primary CTA Platform |
|------|----------|---------------------|
| en | English | WhatsApp |
| zh-TW | Traditional Chinese | LINE |
| zh-CN | Simplified Chinese | WeChat |
| ja | Japanese | LINE |
| th | Thai | LINE |
| mn | Mongolian | WhatsApp |
| ru | Russian | WhatsApp/Telegram |

## Key Features

### 1. AI-Powered Chat
- RAG-enhanced responses using hospital/procedure data
- Multi-turn conversation with context retention
- Tool calling for hospital search, price estimates, inquiry creation
- Streaming responses for real-time experience

### 2. Hospital Discovery
- Semantic search using vector embeddings
- Filter by specialty, location, language, rating, price
- Trust indicators (JCI, certifications)
- Real-time availability

### 3. Content Generation
- Keyword-driven SEO content pipeline
- Multi-language article generation
- Quality scoring and review workflow
- Performance tracking and feedback loop

### 4. Interpreter Matching
- Real-time availability tracking
- Smart matching (language, specialty, rating)
- Booking calendar integration
- Video introduction clips

## Data Flow

### Chat Flow
```
User Query → Embedding → Vector Search → RAG Context → LLM → Stream Response
     │                        │
     ▼                        ▼
  Redis Cache         Supabase (conversation logs)
```

### Content Generation Flow
```
Keyword → Priority Queue → RAG Context → Claude Generation → Quality Check
                                                    │
                                                    ▼
                                          Admin Review → Publish
                                                    │
                                                    ▼
                                          Performance Tracking
```

## Security

- Row Level Security (RLS) in Supabase
- Rate limiting via Upstash Redis
- Role-based access control (Patient, Interpreter, Hospital Admin, Platform Admin)
- Secure session management

## Performance Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Chat Response | < 1.5s (first token) |
| API Response | < 500ms |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2024-01-20 | Initial architecture document | System |
