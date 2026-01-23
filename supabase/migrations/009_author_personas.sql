-- GetCareKorea Author Personas System
-- Migration: 009_author_personas.sql
-- Created: 2026-01-23
-- Purpose: Structured author/interpreter personas for content generation

-- ============================================
-- TABLE: author_personas
-- Stores interpreter personas used for blog authorship
-- ============================================

CREATE TABLE IF NOT EXISTS author_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    slug TEXT NOT NULL UNIQUE,

    -- Multi-language names
    name_ko TEXT NOT NULL,          -- Korean name (e.g., 김서연)
    name_en TEXT NOT NULL,          -- English name (e.g., Kim Seo-yeon)
    name_zh_tw TEXT,                -- Traditional Chinese
    name_zh_cn TEXT,                -- Simplified Chinese
    name_ja TEXT,                   -- Japanese (Katakana)
    name_th TEXT,                   -- Thai
    name_mn TEXT,                   -- Mongolian
    name_ru TEXT,                   -- Russian (Cyrillic)

    -- Profile
    photo_url TEXT,                 -- Professional headshot
    years_of_experience INTEGER NOT NULL DEFAULT 5,

    -- Target Markets (which locales this persona is for)
    target_locales TEXT[] NOT NULL DEFAULT '{"en"}',

    -- Specializations
    primary_specialty TEXT NOT NULL,      -- 'plastic-surgery', 'dermatology', etc.
    secondary_specialties TEXT[] DEFAULT '{}',

    -- Languages spoken
    languages JSONB NOT NULL DEFAULT '[]',  -- [{code: "en", proficiency: "fluent"}, ...]

    -- Certifications & Credentials
    certifications TEXT[] DEFAULT '{}',

    -- Multi-language bios (Short version for author cards)
    bio_short_ko TEXT,
    bio_short_en TEXT,
    bio_short_zh_tw TEXT,
    bio_short_zh_cn TEXT,
    bio_short_ja TEXT,
    bio_short_th TEXT,
    bio_short_mn TEXT,
    bio_short_ru TEXT,

    -- Multi-language bios (Full version for author pages)
    bio_full_ko TEXT,
    bio_full_en TEXT,
    bio_full_zh_tw TEXT,
    bio_full_zh_cn TEXT,
    bio_full_ja TEXT,
    bio_full_th TEXT,
    bio_full_mn TEXT,
    bio_full_ru TEXT,

    -- Writing Style
    writing_tone TEXT NOT NULL DEFAULT 'professional',  -- 'professional', 'friendly', 'expert'
    writing_perspective TEXT NOT NULL DEFAULT 'first-person',

    -- CTA Preferences (for different target markets)
    preferred_messenger TEXT,        -- 'whatsapp', 'line', 'wechat', 'kakao'
    messenger_cta_text JSONB DEFAULT '{}',  -- {en: "Contact via WhatsApp", ja: "LINEでお問い合わせ", ...}

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,

    -- Stats
    total_posts INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update timestamp
CREATE TRIGGER author_personas_updated_at
    BEFORE UPDATE ON author_personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_author_personas_slug ON author_personas(slug);
CREATE INDEX idx_author_personas_specialty ON author_personas(primary_specialty);
CREATE INDEX idx_author_personas_locales ON author_personas USING GIN(target_locales);
CREATE INDEX idx_author_personas_active ON author_personas(is_active) WHERE is_active = TRUE;

-- ============================================
-- Update blog_posts to link to author_personas
-- ============================================

-- Add author_persona_id to blog_posts if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'author_persona_id'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN author_persona_id UUID REFERENCES author_personas(id) ON DELETE SET NULL;
        CREATE INDEX idx_blog_posts_author_persona ON blog_posts(author_persona_id);
    END IF;
END $$;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE author_personas ENABLE ROW LEVEL SECURITY;

-- Public can read active personas
CREATE POLICY "Active personas are viewable by everyone"
    ON author_personas FOR SELECT USING (is_active = true);

-- Admins can manage personas
CREATE POLICY "Admins can manage personas"
    ON author_personas FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- SEED DATA: Initial Author Personas
-- ============================================

-- English/Western Markets Persona
INSERT INTO author_personas (
    slug,
    name_ko, name_en, name_zh_tw, name_ja, name_ru,
    photo_url,
    years_of_experience,
    target_locales,
    primary_specialty,
    secondary_specialties,
    languages,
    certifications,
    bio_short_en,
    bio_full_en,
    writing_tone,
    preferred_messenger,
    messenger_cta_text,
    is_active, is_verified
) VALUES (
    'sophia-chen',
    '진소피아',
    'Sophia Chen',
    '陳蘇菲亞',
    'ソフィア・チェン',
    'София Чен',
    NULL,
    8,
    '{"en", "ru", "mn"}',
    'plastic-surgery',
    '{"dermatology", "dental"}',
    '[{"code": "en", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "zh", "proficiency": "conversational"}]',
    '{"Medical Interpreter Certification", "International Healthcare Coordinator", "TOPIK Level 6"}',
    'Medical tourism interpreter specializing in plastic surgery with 8 years of experience in Seoul.',
    'Hello, I''m Sophia Chen. With 8 years of experience as a medical tourism interpreter in Seoul, I''ve helped over 2,000 international patients navigate Korea''s world-class plastic surgery and dermatology clinics. Fluent in English, Korean, and conversational Chinese, I bridge the gap between Korean medical excellence and patient peace of mind. My background in nursing allows me to explain complex procedures in terms you can understand and trust.',
    'friendly',
    'whatsapp',
    '{"en": "Get Free Consultation via WhatsApp", "ru": "Бесплатная консультация через WhatsApp", "mn": "WhatsApp-аар үнэгүй зөвлөгөө авах"}',
    TRUE, TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Taiwan/Chinese Markets Persona
INSERT INTO author_personas (
    slug,
    name_ko, name_en, name_zh_tw, name_zh_cn, name_ja,
    photo_url,
    years_of_experience,
    target_locales,
    primary_specialty,
    secondary_specialties,
    languages,
    certifications,
    bio_short_zh_tw, bio_short_en,
    bio_full_zh_tw, bio_full_en,
    writing_tone,
    preferred_messenger,
    messenger_cta_text,
    is_active, is_verified
) VALUES (
    'wendy-lin',
    '린웬디',
    'Wendy Lin',
    '林雯迪',
    '林雯迪',
    'ウェンディ・リン',
    NULL,
    6,
    '{"zh-TW", "zh-CN"}',
    'plastic-surgery',
    '{"dermatology", "health-checkup"}',
    '[{"code": "zh-TW", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "fluent"}]',
    '{"HSK Level 6", "Medical Interpreter Certification", "Korean Medical Tourism Coordinator"}',
    '擁有6年韓國醫療美容翻譯經驗，專精整形外科與皮膚科領域。',
    'Medical tourism interpreter with 6 years of experience, specializing in plastic surgery and dermatology.',
    '大家好，我是林雯迪。在韓國首爾從事醫療翻譯工作已經6年了。我專門協助來自台灣和中國的患者，在韓國頂級整形外科和皮膚科診所獲得最佳的醫療服務。精通中文、韓文和英文，我能夠確保您與醫生之間的溝通無障礙，讓您的韓國醫美之旅安心又順利。',
    'Hello, I''m Wendy Lin. With 6 years as a medical tourism interpreter in Seoul, I specialize in helping patients from Taiwan and China navigate Korea''s top plastic surgery and dermatology clinics. Fluent in Mandarin, Korean, and English, I ensure seamless communication between you and your medical team.',
    'professional',
    'line',
    '{"zh-TW": "LINE免費諮詢", "zh-CN": "LINE免费咨询", "en": "Free Consultation via LINE"}',
    TRUE, TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Japan Market Persona
INSERT INTO author_personas (
    slug,
    name_ko, name_en, name_ja, name_zh_tw,
    photo_url,
    years_of_experience,
    target_locales,
    primary_specialty,
    secondary_specialties,
    languages,
    certifications,
    bio_short_ja, bio_short_en,
    bio_full_ja, bio_full_en,
    writing_tone,
    preferred_messenger,
    messenger_cta_text,
    is_active, is_verified
) VALUES (
    'yuki-tanaka',
    '다나카유키',
    'Yuki Tanaka',
    '田中ゆき',
    '田中由紀',
    NULL,
    10,
    '{"ja"}',
    'plastic-surgery',
    '{"dermatology", "dental", "hair-transplant"}',
    '[{"code": "ja", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "conversational"}]',
    '{"JLPT N1", "Medical Interpreter Certification", "Registered Nurse License (Japan)"}',
    '韓国ソウルで10年間、日本人患者様の医療通訳として活動しています。',
    'Medical interpreter with 10 years of experience helping Japanese patients in Seoul.',
    'こんにちは、田中ゆきです。韓国ソウルで10年間、医療通訳として日本人患者様をサポートしてきました。整形外科、皮膚科、歯科、植毛治療など幅広い分野で、2,500名以上の患者様のお手伝いをしてきた経験があります。日本での看護師資格を活かし、医療の専門知識と患者様目線でのケアを両立。韓国での美容医療をお考えの方、安心してお任せください。',
    'Hello, I''m Yuki Tanaka. With 10 years as a medical interpreter in Seoul, I have helped over 2,500 Japanese patients with plastic surgery, dermatology, dental work, and hair transplants. My nursing background in Japan allows me to provide both medical expertise and compassionate patient care.',
    'professional',
    'line',
    '{"ja": "LINEで無料相談", "en": "Free Consultation via LINE"}',
    TRUE, TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Thailand Market Persona
INSERT INTO author_personas (
    slug,
    name_ko, name_en, name_th, name_ja,
    photo_url,
    years_of_experience,
    target_locales,
    primary_specialty,
    secondary_specialties,
    languages,
    certifications,
    bio_short_th, bio_short_en,
    bio_full_th, bio_full_en,
    writing_tone,
    preferred_messenger,
    messenger_cta_text,
    is_active, is_verified
) VALUES (
    'nina-park',
    '박니나',
    'Nina Park',
    'นีน่า พาร์ค',
    'ニーナ・パク',
    NULL,
    5,
    '{"th"}',
    'plastic-surgery',
    '{"dermatology"}',
    '[{"code": "th", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "fluent"}]',
    '{"Medical Interpreter Certification", "Thai Language Proficiency Certificate", "Healthcare Coordinator"}',
    'ล่ามการแพทย์ที่โซล ประสบการณ์ 5 ปี เชี่ยวชาญด้านศัลยกรรมตกแต่งและผิวหนัง',
    'Medical interpreter in Seoul with 5 years experience, specializing in plastic surgery and dermatology.',
    'สวัสดีค่ะ ฉันชื่อนีน่า พาร์ค ทำงานเป็นล่ามการแพทย์ที่กรุงโซลมา 5 ปีแล้วค่ะ เชี่ยวชาญในการช่วยเหลือผู้ป่วยชาวไทยที่มาทำศัลยกรรมตกแต่งและรักษาผิวพรรณที่เกาหลี พูดได้ทั้งไทย เกาหลี และอังกฤษ ช่วยให้การสื่อสารกับคุณหมอราบรื่น มั่นใจได้ค่ะว่าจะดูแลคุณตั้งแต่ปรึกษาจนถึงพักฟื้น',
    'Hello, I''m Nina Park. With 5 years as a medical interpreter in Seoul, I specialize in helping Thai patients with plastic surgery and dermatology treatments in Korea. Fluent in Thai, Korean, and English, I ensure smooth communication with your medical team throughout your journey.',
    'friendly',
    'line',
    '{"th": "ปรึกษาฟรีผ่าน LINE", "en": "Free Consultation via LINE"}',
    TRUE, TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Mongolia Market Persona
INSERT INTO author_personas (
    slug,
    name_ko, name_en, name_mn, name_ru,
    photo_url,
    years_of_experience,
    target_locales,
    primary_specialty,
    secondary_specialties,
    languages,
    certifications,
    bio_short_mn, bio_short_en,
    bio_full_mn, bio_full_en,
    writing_tone,
    preferred_messenger,
    messenger_cta_text,
    is_active, is_verified
) VALUES (
    'oyunaa-bold',
    '볼드오윤아',
    'Oyunaa Bold',
    'Оюунаа Болд',
    'Оюунаа Болд',
    NULL,
    7,
    '{"mn"}',
    'plastic-surgery',
    '{"dermatology", "health-checkup"}',
    '[{"code": "mn", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "conversational"}, {"code": "ru", "proficiency": "conversational"}]',
    '{"Medical Interpreter Certification", "Mongolian-Korean Translation Certificate", "Healthcare Coordinator"}',
    'Сөүлд 7 жил эмнэлгийн орчуулагчаар ажилласан, гоо сайхан болон арьс судлалын чиглэлээр мэргэшсэн.',
    'Medical interpreter in Seoul with 7 years experience, specializing in plastic surgery and dermatology for Mongolian patients.',
    'Сайн байна уу, би Оюунаа Болд. Сөүлд эмнэлгийн аялал жуулчлалын орчуулагчаар 7 жил ажилласан туршлагатай. Монгол хүмүүст Солонгосын шилдэг гоо сайхны болон арьс судлалын эмнэлгүүдэд үйлчлүүлэхэд нь туслаж байна. Монгол, Солонгос, Англи, Орос хэлээр чөлөөтэй ярьж чадна. Та эмнэлэгтэй холбогдоход хэзээ ч бэрхшээлгүй байх болно.',
    'Hello, I''m Oyunaa Bold. With 7 years as a medical tourism interpreter in Seoul, I help Mongolian patients access Korea''s top plastic surgery and dermatology clinics. Fluent in Mongolian, Korean, English, and Russian, I ensure clear communication with your medical team throughout your journey.',
    'friendly',
    'whatsapp',
    '{"mn": "WhatsApp-аар үнэгүй зөвлөгөө авах", "en": "Get Free Consultation via WhatsApp"}',
    TRUE, TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Russia/CIS Market Persona
INSERT INTO author_personas (
    slug,
    name_ko, name_en, name_ru, name_mn,
    photo_url,
    years_of_experience,
    target_locales,
    primary_specialty,
    secondary_specialties,
    languages,
    certifications,
    bio_short_ru, bio_short_en,
    bio_full_ru, bio_full_en,
    writing_tone,
    preferred_messenger,
    messenger_cta_text,
    is_active, is_verified
) VALUES (
    'elena-kim',
    '김엘레나',
    'Elena Kim',
    'Елена Ким',
    'Елена Ким',
    NULL,
    9,
    '{"ru"}',
    'plastic-surgery',
    '{"dermatology", "dental", "health-checkup"}',
    '[{"code": "ru", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "fluent"}]',
    '{"Medical Interpreter Certification", "Russian-Korean Translation Certificate", "International Medical Tourism Coordinator", "Registered Nurse License"}',
    'Медицинский переводчик в Сеуле с 9-летним опытом работы, специализируюсь на пластической хирургии и дерматологии.',
    'Medical interpreter in Seoul with 9 years experience, specializing in plastic surgery, dermatology, and dental care.',
    'Здравствуйте! Меня зовут Елена Ким. Уже 9 лет я работаю медицинским переводчиком в Сеуле, помогая русскоязычным пациентам получить качественную медицинскую помощь в лучших корейских клиниках. Свободно владею русским, корейским и английским языками. Моя цель — обеспечить вам комфортное и безопасное лечение в Корее, от первой консультации до полного восстановления.',
    'Hello, I''m Elena Kim. With 9 years as a medical tourism interpreter in Seoul, I help Russian-speaking patients access Korea''s top medical facilities. Fluent in Russian, Korean, and English, with a nursing background, I provide comprehensive support from consultation to recovery.',
    'professional',
    'whatsapp',
    '{"ru": "Бесплатная консультация через WhatsApp", "en": "Get Free Consultation via WhatsApp"}',
    TRUE, TRUE
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON author_personas TO anon;
GRANT ALL ON author_personas TO authenticated;
