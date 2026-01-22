# Database Schema

## Overview
GetCareKorea uses Supabase (PostgreSQL) as the primary database with Row Level Security (RLS) for multi-tenant access control.

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  profiles   │       │  hospitals  │       │   doctors   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │◄──────┤ hospital_id │
│ role        │       │ name_*      │       │ name_*      │
│ email       │       │ specialties │       │ specialties │
│ locale      │       │ languages   │       │ languages   │
└──────┬──────┘       │ avg_rating  │       └─────────────┘
       │              └──────┬──────┘
       │                     │
       │    ┌────────────────┼────────────────┐
       │    │                │                │
       ▼    ▼                ▼                ▼
┌─────────────┐       ┌─────────────┐  ┌─────────────┐
│  inquiries  │       │  procedures │  │   reviews   │
├─────────────┤       ├─────────────┤  ├─────────────┤
│ profile_id  │       │ hospital_id │  │ hospital_id │
│ hospital_id │       │ name_*      │  │ profile_id  │
│ status      │       │ price_*     │  │ rating      │
└─────────────┘       └─────────────┘  └─────────────┘

┌─────────────┐       ┌─────────────┐
│ interpreters│       │ blog_posts  │
├─────────────┤       ├─────────────┤
│ profile_id  │       │ slug        │
│ languages   │       │ title_*     │
│ specialties │       │ content_*   │
│ hourly_rate │       │ status      │
└─────────────┘       └─────────────┘
```

## Tables

### profiles
User profiles for all user types.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (FK to auth.users) |
| email | text | User email |
| full_name | text | Display name |
| avatar_url | text | Profile image URL |
| role | enum | patient, interpreter, hospital_admin, admin |
| locale | text | Preferred language (en, zh-TW, etc.) |
| phone | text | Phone number |
| preferred_messenger | text | WhatsApp, LINE, WeChat, Telegram |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### hospitals
Hospital/clinic information with multilingual support.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| slug | text | URL-friendly identifier |
| name_en | text | Name in English |
| name_zh_tw | text | Name in Traditional Chinese |
| name_zh_cn | text | Name in Simplified Chinese |
| name_ja | text | Name in Japanese |
| name_th | text | Name in Thai |
| name_mn | text | Name in Mongolian |
| name_ru | text | Name in Russian |
| description_* | text | Description in each language |
| logo_url | text | Hospital logo |
| cover_image_url | text | Cover image |
| gallery | text[] | Gallery image URLs |
| address | text | Physical address |
| city | text | City |
| latitude | decimal | Latitude coordinate |
| longitude | decimal | Longitude coordinate |
| phone | text | Contact phone |
| email | text | Contact email |
| website | text | Website URL |
| specialties | text[] | Medical specialties |
| languages | text[] | Supported languages |
| certifications | text[] | JCI, KHA, etc. |
| has_cctv | boolean | CCTV available |
| has_female_doctor | boolean | Female doctor available |
| operating_hours | jsonb | Operating schedule |
| avg_rating | decimal | Average rating |
| review_count | integer | Total review count |
| is_featured | boolean | Featured listing |
| is_verified | boolean | Verified hospital |
| status | enum | draft, published, archived |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### doctors
Doctor profiles linked to hospitals.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| hospital_id | uuid | FK to hospitals |
| name_* | text | Name in each language |
| title_* | text | Title/credentials |
| bio_* | text | Biography |
| photo_url | text | Profile photo |
| specialties | text[] | Specializations |
| languages | text[] | Languages spoken |
| years_experience | integer | Years of experience |
| education | jsonb | Education history |
| certifications | text[] | Certifications |
| is_available | boolean | Currently accepting patients |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### procedures
Medical procedures offered by hospitals.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| hospital_id | uuid | FK to hospitals |
| slug | text | URL-friendly identifier |
| category | text | Procedure category |
| name_* | text | Name in each language |
| description_* | text | Description |
| price_min | integer | Minimum price (USD) |
| price_max | integer | Maximum price (USD) |
| price_currency | text | Currency code |
| duration_minutes | integer | Procedure duration |
| recovery_days | integer | Recovery period |
| includes | text[] | What's included |
| requirements | text[] | Pre-procedure requirements |
| is_popular | boolean | Popular procedure |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### interpreters
Medical interpreter profiles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | FK to profiles |
| languages | text[] | Languages (with proficiency) |
| specialties | text[] | Medical specialties |
| bio_* | text | Biography in each language |
| photo_url | text | Profile photo |
| video_url | text | Introduction video |
| hourly_rate | integer | Rate per hour (USD) |
| daily_rate | integer | Rate per day (USD) |
| availability | jsonb | Availability schedule |
| avg_rating | decimal | Average rating |
| review_count | integer | Total review count |
| total_bookings | integer | Completed bookings |
| is_verified | boolean | Identity verified |
| is_available | boolean | Currently available |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### bookings
Appointment bookings.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | FK to profiles (patient) |
| hospital_id | uuid | FK to hospitals |
| interpreter_id | uuid | FK to interpreters (optional) |
| procedure_id | uuid | FK to procedures (optional) |
| doctor_id | uuid | FK to doctors (optional) |
| booking_date | date | Appointment date |
| booking_time | time | Appointment time |
| status | enum | pending, confirmed, completed, cancelled |
| notes | text | Special requests |
| total_price | integer | Total price |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### inquiries
General inquiries from patients.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | FK to profiles (optional, guest) |
| hospital_id | uuid | FK to hospitals (optional) |
| name | text | Contact name |
| email | text | Contact email |
| phone | text | Contact phone |
| messenger_type | text | Preferred messenger |
| messenger_id | text | Messenger ID |
| procedure_interest | text | Interested procedure |
| message | text | Inquiry message |
| locale | text | User's language |
| status | enum | new, in_progress, resolved, closed |
| assigned_to | uuid | FK to profiles (admin/interpreter) |
| communication_log | jsonb | Communication history |
| source | text | How they found us |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### reviews
Reviews for hospitals, doctors, interpreters.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | FK to profiles (reviewer) |
| hospital_id | uuid | FK to hospitals (optional) |
| doctor_id | uuid | FK to doctors (optional) |
| interpreter_id | uuid | FK to interpreters (optional) |
| booking_id | uuid | FK to bookings (optional) |
| rating | integer | 1-5 rating |
| title | text | Review title |
| content | text | Review content |
| photos | text[] | Review photos |
| procedure_type | text | Procedure received |
| visit_date | date | Visit date |
| is_verified | boolean | Verified purchase |
| is_featured | boolean | Featured review |
| status | enum | pending, approved, rejected |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### blog_posts
Multi-language blog content.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| slug | text | URL-friendly identifier |
| title_* | text | Title in each language |
| excerpt_* | text | Short excerpt |
| content_* | text | Full content (markdown) |
| meta_title_* | text | SEO meta title |
| meta_description_* | text | SEO meta description |
| cover_image_url | text | Cover image |
| category | text | Article category |
| tags | text[] | Article tags |
| author_id | uuid | FK to profiles |
| status | enum | draft, review, published, archived |
| published_at | timestamptz | Publication date |
| generation_metadata | jsonb | AI generation info |
| view_count | integer | Total views |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### content_keywords
Keywords for AI content generation.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| keyword | text | Target keyword |
| category | text | Keyword category |
| locale | text | Target language |
| search_volume | integer | Monthly searches |
| competition | decimal | Competition score |
| priority | integer | Generation priority |
| status | enum | pending, generating, generated, published |
| blog_post_id | uuid | FK to blog_posts (if generated) |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### chat_conversations
AI chat conversation logs.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | FK to profiles (optional) |
| session_id | text | Anonymous session ID |
| locale | text | Conversation language |
| messages | jsonb | Conversation messages |
| metadata | jsonb | Additional metadata |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Indexes

```sql
-- Hospitals
CREATE INDEX idx_hospitals_specialties ON hospitals USING GIN(specialties);
CREATE INDEX idx_hospitals_languages ON hospitals USING GIN(languages);
CREATE INDEX idx_hospitals_rating ON hospitals(avg_rating DESC);
CREATE INDEX idx_hospitals_status ON hospitals(status) WHERE status = 'published';

-- Procedures
CREATE INDEX idx_procedures_hospital ON procedures(hospital_id);
CREATE INDEX idx_procedures_category ON procedures(category);

-- Interpreters
CREATE INDEX idx_interpreters_languages ON interpreters USING GIN(languages);
CREATE INDEX idx_interpreters_rating ON interpreters(avg_rating DESC);

-- Blog Posts
CREATE INDEX idx_blog_posts_status ON blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);

-- Inquiries
CREATE INDEX idx_inquiries_status ON inquiries(status, created_at DESC);

-- Reviews
CREATE INDEX idx_reviews_hospital ON reviews(hospital_id, status);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

## Row Level Security (RLS)

See `/lib/db/rls.sql` for complete RLS policies.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2024-01-20 | Initial schema design | System |
