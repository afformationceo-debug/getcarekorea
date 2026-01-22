-- GetCareKorea Database Schema
-- Supabase PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE user_role AS ENUM ('patient', 'interpreter', 'hospital_admin', 'admin');
CREATE TYPE content_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE inquiry_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE keyword_status AS ENUM ('pending', 'generating', 'generated', 'published');

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'patient',
    locale TEXT DEFAULT 'en',
    phone TEXT,
    preferred_messenger TEXT, -- whatsapp, line, wechat, telegram
    messenger_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HOSPITALS
-- =====================================================
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,

    -- Multilingual names
    name_en TEXT NOT NULL,
    name_zh_tw TEXT,
    name_zh_cn TEXT,
    name_ja TEXT,
    name_th TEXT,
    name_mn TEXT,
    name_ru TEXT,

    -- Multilingual descriptions
    description_en TEXT,
    description_zh_tw TEXT,
    description_zh_cn TEXT,
    description_ja TEXT,
    description_th TEXT,
    description_mn TEXT,
    description_ru TEXT,

    -- Media
    logo_url TEXT,
    cover_image_url TEXT,
    gallery TEXT[] DEFAULT '{}',

    -- Location
    address TEXT,
    city TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Contact
    phone TEXT,
    email TEXT,
    website TEXT,

    -- Attributes
    specialties TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    has_cctv BOOLEAN DEFAULT FALSE,
    has_female_doctor BOOLEAN DEFAULT FALSE,
    operating_hours JSONB DEFAULT '{}',

    -- Metrics
    avg_rating DECIMAL(2, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,

    -- Status
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    status content_status DEFAULT 'draft',

    -- Admin
    admin_id UUID REFERENCES profiles(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCTORS
-- =====================================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,

    -- Multilingual names
    name_en TEXT NOT NULL,
    name_zh_tw TEXT,
    name_zh_cn TEXT,
    name_ja TEXT,
    name_th TEXT,
    name_mn TEXT,
    name_ru TEXT,

    -- Multilingual titles
    title_en TEXT,
    title_zh_tw TEXT,
    title_zh_cn TEXT,
    title_ja TEXT,
    title_th TEXT,
    title_mn TEXT,
    title_ru TEXT,

    -- Multilingual bios
    bio_en TEXT,
    bio_zh_tw TEXT,
    bio_zh_cn TEXT,
    bio_ja TEXT,
    bio_th TEXT,
    bio_mn TEXT,
    bio_ru TEXT,

    -- Profile
    photo_url TEXT,
    specialties TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    years_experience INTEGER DEFAULT 0,
    education JSONB DEFAULT '[]',
    certifications TEXT[] DEFAULT '{}',

    -- Status
    is_available BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROCEDURES
-- =====================================================
CREATE TABLE procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    category TEXT NOT NULL,

    -- Multilingual names
    name_en TEXT NOT NULL,
    name_zh_tw TEXT,
    name_zh_cn TEXT,
    name_ja TEXT,
    name_th TEXT,
    name_mn TEXT,
    name_ru TEXT,

    -- Multilingual descriptions
    description_en TEXT,
    description_zh_tw TEXT,
    description_zh_cn TEXT,
    description_ja TEXT,
    description_th TEXT,
    description_mn TEXT,
    description_ru TEXT,

    -- Pricing
    price_min INTEGER,
    price_max INTEGER,
    price_currency TEXT DEFAULT 'USD',

    -- Details
    duration_minutes INTEGER,
    recovery_days INTEGER,
    includes TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',

    -- Status
    is_popular BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(hospital_id, slug)
);

-- =====================================================
-- INTERPRETERS
-- =====================================================
CREATE TABLE interpreters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Languages with proficiency
    languages JSONB NOT NULL DEFAULT '[]', -- [{"code": "en", "level": "native"}, ...]
    specialties TEXT[] DEFAULT '{}',

    -- Multilingual bios
    bio_en TEXT,
    bio_zh_tw TEXT,
    bio_zh_cn TEXT,
    bio_ja TEXT,
    bio_th TEXT,
    bio_mn TEXT,
    bio_ru TEXT,

    -- Profile
    photo_url TEXT,
    video_url TEXT,

    -- Pricing
    hourly_rate INTEGER,
    daily_rate INTEGER,

    -- Availability
    availability JSONB DEFAULT '{}',

    -- Metrics
    avg_rating DECIMAL(2, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,

    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BOOKINGS
-- =====================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    hospital_id UUID REFERENCES hospitals(id),
    interpreter_id UUID REFERENCES interpreters(id),
    procedure_id UUID REFERENCES procedures(id),
    doctor_id UUID REFERENCES doctors(id),

    -- Schedule
    booking_date DATE NOT NULL,
    booking_time TIME,

    -- Status
    status booking_status DEFAULT 'pending',

    -- Details
    notes TEXT,
    total_price INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INQUIRIES
-- =====================================================
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id),
    hospital_id UUID REFERENCES hospitals(id),

    -- Contact info (for guests)
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    messenger_type TEXT,
    messenger_id TEXT,

    -- Inquiry details
    procedure_interest TEXT,
    message TEXT NOT NULL,
    locale TEXT DEFAULT 'en',

    -- Status
    status inquiry_status DEFAULT 'new',
    assigned_to UUID REFERENCES profiles(id),

    -- Communication log
    communication_log JSONB DEFAULT '[]',

    -- Source tracking
    source TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REVIEWS
-- =====================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    hospital_id UUID REFERENCES hospitals(id),
    doctor_id UUID REFERENCES doctors(id),
    interpreter_id UUID REFERENCES interpreters(id),
    booking_id UUID REFERENCES bookings(id),

    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    photos TEXT[] DEFAULT '{}',

    -- Context
    procedure_type TEXT,
    visit_date DATE,

    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status review_status DEFAULT 'pending',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- At least one target required
    CONSTRAINT review_target_check CHECK (
        hospital_id IS NOT NULL OR
        doctor_id IS NOT NULL OR
        interpreter_id IS NOT NULL
    )
);

-- =====================================================
-- BLOG POSTS
-- =====================================================
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,

    -- Multilingual titles
    title_en TEXT NOT NULL,
    title_zh_tw TEXT,
    title_zh_cn TEXT,
    title_ja TEXT,
    title_th TEXT,
    title_mn TEXT,
    title_ru TEXT,

    -- Multilingual excerpts
    excerpt_en TEXT,
    excerpt_zh_tw TEXT,
    excerpt_zh_cn TEXT,
    excerpt_ja TEXT,
    excerpt_th TEXT,
    excerpt_mn TEXT,
    excerpt_ru TEXT,

    -- Multilingual content
    content_en TEXT,
    content_zh_tw TEXT,
    content_zh_cn TEXT,
    content_ja TEXT,
    content_th TEXT,
    content_mn TEXT,
    content_ru TEXT,

    -- Multilingual SEO
    meta_title_en TEXT,
    meta_title_zh_tw TEXT,
    meta_title_zh_cn TEXT,
    meta_title_ja TEXT,
    meta_title_th TEXT,
    meta_title_mn TEXT,
    meta_title_ru TEXT,

    meta_description_en TEXT,
    meta_description_zh_tw TEXT,
    meta_description_zh_cn TEXT,
    meta_description_ja TEXT,
    meta_description_th TEXT,
    meta_description_mn TEXT,
    meta_description_ru TEXT,

    -- Media
    cover_image_url TEXT,

    -- Categorization
    category TEXT,
    tags TEXT[] DEFAULT '{}',

    -- Author
    author_id UUID REFERENCES profiles(id),

    -- Status
    status content_status DEFAULT 'draft',
    published_at TIMESTAMPTZ,

    -- AI Generation metadata
    generation_metadata JSONB DEFAULT '{}',

    -- Metrics
    view_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTENT KEYWORDS
-- =====================================================
CREATE TABLE content_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword TEXT NOT NULL,
    category TEXT,
    locale TEXT DEFAULT 'en',

    -- SEO metrics
    search_volume INTEGER DEFAULT 0,
    competition DECIMAL(3, 2) DEFAULT 0,

    -- Priority
    priority INTEGER DEFAULT 0,

    -- Status
    status keyword_status DEFAULT 'pending',

    -- Link to generated content
    blog_post_id UUID REFERENCES blog_posts(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(keyword, locale)
);

-- =====================================================
-- CHAT CONVERSATIONS
-- =====================================================
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id),
    session_id TEXT NOT NULL,
    locale TEXT DEFAULT 'en',

    -- Messages
    messages JSONB DEFAULT '[]',

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LLM INTERACTION LOGS
-- =====================================================
CREATE TABLE llm_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chat_conversations(id),

    -- Request
    model TEXT NOT NULL,
    prompt_version TEXT,
    input_tokens INTEGER DEFAULT 0,

    -- Response
    output_tokens INTEGER DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,

    -- Feedback
    feedback_rating INTEGER, -- 1-5
    feedback_text TEXT,

    -- Cost
    cost_usd DECIMAL(10, 6) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Hospitals
CREATE INDEX idx_hospitals_specialties ON hospitals USING GIN(specialties);
CREATE INDEX idx_hospitals_languages ON hospitals USING GIN(languages);
CREATE INDEX idx_hospitals_certifications ON hospitals USING GIN(certifications);
CREATE INDEX idx_hospitals_city ON hospitals(city);
CREATE INDEX idx_hospitals_rating ON hospitals(avg_rating DESC);
CREATE INDEX idx_hospitals_status ON hospitals(status) WHERE status = 'published';
CREATE INDEX idx_hospitals_featured ON hospitals(is_featured) WHERE is_featured = TRUE;

-- Doctors
CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX idx_doctors_specialties ON doctors USING GIN(specialties);
CREATE INDEX idx_doctors_languages ON doctors USING GIN(languages);

-- Procedures
CREATE INDEX idx_procedures_hospital ON procedures(hospital_id);
CREATE INDEX idx_procedures_category ON procedures(category);
CREATE INDEX idx_procedures_popular ON procedures(is_popular) WHERE is_popular = TRUE;

-- Interpreters
CREATE INDEX idx_interpreters_profile ON interpreters(profile_id);
CREATE INDEX idx_interpreters_languages ON interpreters USING GIN(languages);
CREATE INDEX idx_interpreters_specialties ON interpreters USING GIN(specialties);
CREATE INDEX idx_interpreters_rating ON interpreters(avg_rating DESC);
CREATE INDEX idx_interpreters_available ON interpreters(is_available) WHERE is_available = TRUE;

-- Bookings
CREATE INDEX idx_bookings_profile ON bookings(profile_id);
CREATE INDEX idx_bookings_hospital ON bookings(hospital_id);
CREATE INDEX idx_bookings_interpreter ON bookings(interpreter_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- Inquiries
CREATE INDEX idx_inquiries_profile ON inquiries(profile_id);
CREATE INDEX idx_inquiries_hospital ON inquiries(hospital_id);
CREATE INDEX idx_inquiries_status ON inquiries(status, created_at DESC);
CREATE INDEX idx_inquiries_assigned ON inquiries(assigned_to);

-- Reviews
CREATE INDEX idx_reviews_hospital ON reviews(hospital_id, status);
CREATE INDEX idx_reviews_doctor ON reviews(doctor_id, status);
CREATE INDEX idx_reviews_interpreter ON reviews(interpreter_id, status);
CREATE INDEX idx_reviews_profile ON reviews(profile_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_featured ON reviews(is_featured) WHERE is_featured = TRUE;

-- Blog Posts
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Content Keywords
CREATE INDEX idx_keywords_status ON content_keywords(status);
CREATE INDEX idx_keywords_priority ON content_keywords(priority DESC);
CREATE INDEX idx_keywords_locale ON content_keywords(locale);

-- Chat Conversations
CREATE INDEX idx_conversations_profile ON chat_conversations(profile_id);
CREATE INDEX idx_conversations_session ON chat_conversations(session_id);

-- LLM Interactions
CREATE INDEX idx_llm_conversation ON llm_interactions(conversation_id);
CREATE INDEX idx_llm_model ON llm_interactions(model);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON procedures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interpreters_updated_at BEFORE UPDATE ON interpreters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON content_keywords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update hospital rating after review
CREATE OR REPLACE FUNCTION update_hospital_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE hospitals SET
        avg_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE hospital_id = COALESCE(NEW.hospital_id, OLD.hospital_id)
            AND status = 'approved'
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE hospital_id = COALESCE(NEW.hospital_id, OLD.hospital_id)
            AND status = 'approved'
        )
    WHERE id = COALESCE(NEW.hospital_id, OLD.hospital_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hospital_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_hospital_rating();

-- Update interpreter rating after review
CREATE OR REPLACE FUNCTION update_interpreter_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE interpreters SET
        avg_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE interpreter_id = COALESCE(NEW.interpreter_id, OLD.interpreter_id)
            AND status = 'approved'
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE interpreter_id = COALESCE(NEW.interpreter_id, OLD.interpreter_id)
            AND status = 'approved'
        )
    WHERE id = COALESCE(NEW.interpreter_id, OLD.interpreter_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interpreter_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
WHEN (COALESCE(NEW.interpreter_id, OLD.interpreter_id) IS NOT NULL)
EXECUTE FUNCTION update_interpreter_rating();
