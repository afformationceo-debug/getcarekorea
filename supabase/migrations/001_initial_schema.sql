-- GetCareKorea Database Schema
-- Initial Migration
-- Created: 2026-01-20

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('patient', 'interpreter', 'hospital_admin', 'admin');
CREATE TYPE content_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE inquiry_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE keyword_status AS ENUM ('pending', 'generating', 'generated', 'published');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'patient',
    locale TEXT NOT NULL DEFAULT 'en',
    phone TEXT,
    preferred_messenger TEXT,
    messenger_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- TABLE: hospitals
-- ============================================
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    -- Multi-language name fields
    name_en TEXT NOT NULL,
    name_zh_tw TEXT,
    name_zh_cn TEXT,
    name_ja TEXT,
    name_th TEXT,
    name_mn TEXT,
    name_ru TEXT,
    -- Multi-language description fields
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
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    -- Contact
    phone TEXT,
    email TEXT,
    website TEXT,
    -- Features
    specialties TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    has_cctv BOOLEAN DEFAULT FALSE,
    has_female_doctor BOOLEAN DEFAULT FALSE,
    operating_hours JSONB DEFAULT '{}',
    -- Stats
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    -- Status
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    status content_status DEFAULT 'draft',
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER hospitals_updated_at
    BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for hospital queries
CREATE INDEX idx_hospitals_slug ON hospitals(slug);
CREATE INDEX idx_hospitals_city ON hospitals(city);
CREATE INDEX idx_hospitals_specialties ON hospitals USING GIN(specialties);
CREATE INDEX idx_hospitals_languages ON hospitals USING GIN(languages);
CREATE INDEX idx_hospitals_rating ON hospitals(avg_rating DESC);
CREATE INDEX idx_hospitals_status ON hospitals(status);
CREATE INDEX idx_hospitals_featured ON hospitals(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- TABLE: doctors
-- ============================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    -- Multi-language name fields
    name_en TEXT NOT NULL,
    name_zh_tw TEXT,
    name_zh_cn TEXT,
    name_ja TEXT,
    name_th TEXT,
    name_mn TEXT,
    name_ru TEXT,
    -- Multi-language title fields
    title_en TEXT,
    title_zh_tw TEXT,
    title_zh_cn TEXT,
    title_ja TEXT,
    title_th TEXT,
    title_mn TEXT,
    title_ru TEXT,
    -- Multi-language bio fields
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
    is_available BOOLEAN DEFAULT TRUE,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX idx_doctors_specialties ON doctors USING GIN(specialties);
CREATE INDEX idx_doctors_available ON doctors(is_available) WHERE is_available = TRUE;

-- ============================================
-- TABLE: procedures
-- ============================================
CREATE TABLE procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    category TEXT NOT NULL,
    -- Multi-language name fields
    name_en TEXT NOT NULL,
    name_zh_tw TEXT,
    name_zh_cn TEXT,
    name_ja TEXT,
    name_th TEXT,
    name_mn TEXT,
    name_ru TEXT,
    -- Multi-language description fields
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
    is_popular BOOLEAN DEFAULT FALSE,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hospital_id, slug)
);

CREATE TRIGGER procedures_updated_at
    BEFORE UPDATE ON procedures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_procedures_hospital ON procedures(hospital_id);
CREATE INDEX idx_procedures_category ON procedures(category);
CREATE INDEX idx_procedures_slug ON procedures(slug);
CREATE INDEX idx_procedures_popular ON procedures(is_popular) WHERE is_popular = TRUE;

-- ============================================
-- TABLE: interpreters
-- ============================================
CREATE TABLE interpreters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    languages JSONB DEFAULT '[]', -- [{language: "Korean", proficiency: "native"}, ...]
    specialties TEXT[] DEFAULT '{}',
    -- Multi-language bio fields
    bio_en TEXT,
    bio_zh_tw TEXT,
    bio_zh_cn TEXT,
    bio_ja TEXT,
    bio_th TEXT,
    bio_mn TEXT,
    bio_ru TEXT,
    -- Media
    photo_url TEXT,
    video_url TEXT,
    -- Pricing
    hourly_rate INTEGER,
    daily_rate INTEGER,
    -- Availability
    availability JSONB DEFAULT '{}', -- {monday: [{start: "09:00", end: "18:00"}], ...}
    -- Stats
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER interpreters_updated_at
    BEFORE UPDATE ON interpreters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_interpreters_profile ON interpreters(profile_id);
CREATE INDEX idx_interpreters_languages ON interpreters USING GIN(languages);
CREATE INDEX idx_interpreters_specialties ON interpreters USING GIN(specialties);
CREATE INDEX idx_interpreters_rating ON interpreters(avg_rating DESC);
CREATE INDEX idx_interpreters_available ON interpreters(is_available) WHERE is_available = TRUE;

-- ============================================
-- TABLE: bookings
-- ============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    interpreter_id UUID REFERENCES interpreters(id) ON DELETE SET NULL,
    procedure_id UUID REFERENCES procedures(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time TIME,
    status booking_status DEFAULT 'pending',
    notes TEXT,
    total_price INTEGER,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_bookings_profile ON bookings(profile_id);
CREATE INDEX idx_bookings_hospital ON bookings(hospital_id);
CREATE INDEX idx_bookings_interpreter ON bookings(interpreter_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================
-- TABLE: inquiries
-- ============================================
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    messenger_type TEXT, -- 'whatsapp', 'line', 'wechat', 'kakao', 'telegram'
    messenger_id TEXT,
    procedure_interest TEXT,
    message TEXT NOT NULL,
    locale TEXT DEFAULT 'en',
    status inquiry_status DEFAULT 'new',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    communication_log JSONB DEFAULT '[]', -- [{timestamp, type, content, by}, ...]
    source TEXT, -- 'website', 'chat', 'referral'
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER inquiries_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_inquiries_email ON inquiries(email);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_hospital ON inquiries(hospital_id);
CREATE INDEX idx_inquiries_assigned ON inquiries(assigned_to);
CREATE INDEX idx_inquiries_created ON inquiries(created_at DESC);

-- ============================================
-- TABLE: reviews
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    interpreter_id UUID REFERENCES interpreters(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    photos TEXT[] DEFAULT '{}',
    procedure_type TEXT,
    visit_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status review_status DEFAULT 'pending',
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure review is for at least one entity
    CONSTRAINT review_target CHECK (
        hospital_id IS NOT NULL OR interpreter_id IS NOT NULL
    )
);

CREATE TRIGGER reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_reviews_profile ON reviews(profile_id);
CREATE INDEX idx_reviews_hospital ON reviews(hospital_id);
CREATE INDEX idx_reviews_interpreter ON reviews(interpreter_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX idx_reviews_featured ON reviews(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- TABLE: blog_posts
-- ============================================
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    -- Multi-language title fields
    title_en TEXT NOT NULL,
    title_zh_tw TEXT,
    title_zh_cn TEXT,
    title_ja TEXT,
    title_th TEXT,
    title_mn TEXT,
    title_ru TEXT,
    -- Multi-language excerpt fields
    excerpt_en TEXT,
    excerpt_zh_tw TEXT,
    excerpt_zh_cn TEXT,
    excerpt_ja TEXT,
    excerpt_th TEXT,
    excerpt_mn TEXT,
    excerpt_ru TEXT,
    -- Multi-language content fields
    content_en TEXT,
    content_zh_tw TEXT,
    content_zh_cn TEXT,
    content_ja TEXT,
    content_th TEXT,
    content_mn TEXT,
    content_ru TEXT,
    -- Multi-language meta title fields
    meta_title_en TEXT,
    meta_title_zh_tw TEXT,
    meta_title_zh_cn TEXT,
    meta_title_ja TEXT,
    meta_title_th TEXT,
    meta_title_mn TEXT,
    meta_title_ru TEXT,
    -- Multi-language meta description fields
    meta_description_en TEXT,
    meta_description_zh_tw TEXT,
    meta_description_zh_cn TEXT,
    meta_description_ja TEXT,
    meta_description_th TEXT,
    meta_description_mn TEXT,
    meta_description_ru TEXT,
    -- Media & Categorization
    cover_image_url TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- Status
    status content_status DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    -- AI Generation Metadata
    generation_metadata JSONB DEFAULT '{}', -- {model, prompt_version, generation_time, cost}
    -- Stats
    view_count INTEGER DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_views ON blog_posts(view_count DESC);

-- Full text search index for blog posts
CREATE INDEX idx_blog_posts_search_en ON blog_posts USING GIN(
    to_tsvector('english', COALESCE(title_en, '') || ' ' || COALESCE(excerpt_en, '') || ' ' || COALESCE(content_en, ''))
);

-- ============================================
-- TABLE: content_keywords
-- ============================================
CREATE TABLE content_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    category TEXT,
    locale TEXT DEFAULT 'en',
    search_volume INTEGER DEFAULT 0,
    competition DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    priority INTEGER DEFAULT 0,
    status keyword_status DEFAULT 'pending',
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(keyword, locale)
);

CREATE TRIGGER content_keywords_updated_at
    BEFORE UPDATE ON content_keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_content_keywords_keyword ON content_keywords(keyword);
CREATE INDEX idx_content_keywords_category ON content_keywords(category);
CREATE INDEX idx_content_keywords_status ON content_keywords(status);
CREATE INDEX idx_content_keywords_priority ON content_keywords(priority DESC);

-- ============================================
-- TABLE: chat_conversations
-- ============================================
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    locale TEXT DEFAULT 'en',
    messages JSONB DEFAULT '[]', -- [{role, content, timestamp}, ...]
    metadata JSONB DEFAULT '{}', -- {user_agent, referrer, page_url}
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_chat_conversations_profile ON chat_conversations(profile_id);
CREATE INDEX idx_chat_conversations_session ON chat_conversations(session_id);
CREATE INDEX idx_chat_conversations_created ON chat_conversations(created_at DESC);

-- ============================================
-- TABLE: llm_interactions
-- ============================================
CREATE TABLE llm_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    prompt_version TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_text TEXT,
    cost_usd DECIMAL(10,6) DEFAULT 0.000000,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_llm_interactions_conversation ON llm_interactions(conversation_id);
CREATE INDEX idx_llm_interactions_model ON llm_interactions(model);
CREATE INDEX idx_llm_interactions_created ON llm_interactions(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpreters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_interactions ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- HOSPITALS policies (public read, admin write)
CREATE POLICY "Hospitals are viewable by everyone"
    ON hospitals FOR SELECT USING (status = 'published' OR auth.uid() = admin_id);

CREATE POLICY "Admins can insert hospitals"
    ON hospitals FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hospital_admin'))
    );

CREATE POLICY "Admins can update own hospitals"
    ON hospitals FOR UPDATE USING (
        auth.uid() = admin_id OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- DOCTORS policies
CREATE POLICY "Doctors are viewable by everyone"
    ON doctors FOR SELECT USING (true);

CREATE POLICY "Hospital admins can manage doctors"
    ON doctors FOR ALL USING (
        EXISTS (
            SELECT 1 FROM hospitals h
            WHERE h.id = doctors.hospital_id
            AND (h.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

-- PROCEDURES policies
CREATE POLICY "Procedures are viewable by everyone"
    ON procedures FOR SELECT USING (true);

CREATE POLICY "Hospital admins can manage procedures"
    ON procedures FOR ALL USING (
        EXISTS (
            SELECT 1 FROM hospitals h
            WHERE h.id = procedures.hospital_id
            AND (h.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

-- INTERPRETERS policies
CREATE POLICY "Interpreters are viewable by everyone"
    ON interpreters FOR SELECT USING (is_available = true OR profile_id = auth.uid());

CREATE POLICY "Interpreters can update own profile"
    ON interpreters FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Interpreters can insert own profile"
    ON interpreters FOR INSERT WITH CHECK (profile_id = auth.uid());

-- BOOKINGS policies
CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT USING (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM interpreters WHERE id = bookings.interpreter_id AND profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM hospitals WHERE id = bookings.hospital_id AND admin_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can create bookings"
    ON bookings FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Relevant parties can update bookings"
    ON bookings FOR UPDATE USING (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM interpreters WHERE id = bookings.interpreter_id AND profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM hospitals WHERE id = bookings.hospital_id AND admin_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- INQUIRIES policies
CREATE POLICY "Admins can view all inquiries"
    ON inquiries FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM hospitals WHERE id = inquiries.hospital_id AND admin_id = auth.uid())
    );

CREATE POLICY "Anyone can create inquiries"
    ON inquiries FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update inquiries"
    ON inquiries FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM hospitals WHERE id = inquiries.hospital_id AND admin_id = auth.uid())
    );

-- REVIEWS policies
CREATE POLICY "Approved reviews are viewable by everyone"
    ON reviews FOR SELECT USING (status = 'approved' OR profile_id = auth.uid());

CREATE POLICY "Users can create reviews"
    ON reviews FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own reviews"
    ON reviews FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage reviews"
    ON reviews FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- BLOG_POSTS policies
CREATE POLICY "Published posts are viewable by everyone"
    ON blog_posts FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage blog posts"
    ON blog_posts FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- CONTENT_KEYWORDS policies
CREATE POLICY "Admins can manage keywords"
    ON content_keywords FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- CHAT_CONVERSATIONS policies
CREATE POLICY "Users can view own conversations"
    ON chat_conversations FOR SELECT USING (
        profile_id = auth.uid() OR
        session_id = current_setting('app.session_id', true) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Anyone can create conversations"
    ON chat_conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own conversations"
    ON chat_conversations FOR UPDATE USING (
        profile_id = auth.uid() OR
        session_id = current_setting('app.session_id', true)
    );

-- LLM_INTERACTIONS policies
CREATE POLICY "Admins can view LLM interactions"
    ON llm_interactions FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "System can insert LLM interactions"
    ON llm_interactions FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS FOR STATISTICS
-- ============================================

-- Update hospital average rating
CREATE OR REPLACE FUNCTION update_hospital_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_hospital_id UUID;
BEGIN
    -- Get the relevant hospital_id based on operation type
    IF TG_OP = 'DELETE' THEN
        target_hospital_id := OLD.hospital_id;
    ELSE
        target_hospital_id := COALESCE(NEW.hospital_id, OLD.hospital_id);
    END IF;

    -- Only update if we have a valid hospital_id
    IF target_hospital_id IS NOT NULL THEN
        UPDATE hospitals
        SET
            avg_rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM reviews
                WHERE hospital_id = target_hospital_id
                AND status = 'approved'
            ),
            review_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE hospital_id = target_hospital_id
                AND status = 'approved'
            )
        WHERE id = target_hospital_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hospital_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_hospital_rating();

-- Update interpreter average rating
CREATE OR REPLACE FUNCTION update_interpreter_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_interpreter_id UUID;
BEGIN
    -- Get the relevant interpreter_id based on operation type
    IF TG_OP = 'DELETE' THEN
        target_interpreter_id := OLD.interpreter_id;
    ELSE
        target_interpreter_id := COALESCE(NEW.interpreter_id, OLD.interpreter_id);
    END IF;

    -- Only update if we have a valid interpreter_id
    IF target_interpreter_id IS NOT NULL THEN
        UPDATE interpreters
        SET
            avg_rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM reviews
                WHERE interpreter_id = target_interpreter_id
                AND status = 'approved'
            ),
            review_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE interpreter_id = target_interpreter_id
                AND status = 'approved'
            )
        WHERE id = target_interpreter_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interpreter_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_interpreter_rating();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Hospital listing view with computed fields
CREATE OR REPLACE VIEW hospital_listings AS
SELECT
    h.*,
    COALESCE(
        ARRAY(
            SELECT DISTINCT d.name_en
            FROM doctors d
            WHERE d.hospital_id = h.id
            AND d.is_available = true
            LIMIT 5
        ),
        '{}'
    ) AS top_doctors
FROM hospitals h
WHERE h.status = 'published';

-- Interpreter listing view
CREATE OR REPLACE VIEW interpreter_listings AS
SELECT
    i.*,
    p.full_name,
    p.email,
    p.avatar_url AS profile_avatar
FROM interpreters i
JOIN profiles p ON i.profile_id = p.id
WHERE i.is_available = true;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all tables to anon (for public read access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant all permissions to authenticated users (RLS will control access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
