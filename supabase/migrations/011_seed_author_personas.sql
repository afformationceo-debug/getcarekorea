-- GetCareKorea Author Personas Seed Data
-- Migration: 011_seed_author_personas.sql
-- Created: 2026-01-23
-- Purpose: Insert initial author personas (interpreters) for all target locales

-- ============================================
-- Ensure messenger_id column exists
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'messenger_id'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN messenger_id TEXT;
    END IF;
END $$;

-- ============================================
-- Clear existing test data (if any)
-- ============================================
-- DELETE FROM author_personas WHERE slug LIKE 'test-%';

-- ============================================
-- English-speaking Interpreters (en)
-- ============================================

INSERT INTO author_personas (
    slug, name_en, name_ko,
    bio_short_en, bio_short_ko,
    bio_full_en, bio_full_ko,
    photo_url,
    languages,
    primary_specialty, secondary_specialties,
    years_of_experience, certifications,
    target_locales,
    writing_tone, writing_perspective,
    preferred_messenger, messenger_id,
    messenger_cta_text,
    hourly_rate, daily_rate,
    is_active, is_available, is_featured, is_verified,
    display_order
) VALUES
(
    'sarah-kim',
    'Sarah Kim',
    '김서연',
    'Board-certified medical interpreter with 12 years of experience in plastic surgery and dermatology.',
    '12년 경력의 성형외과/피부과 전문 의료통역사입니다.',
    'Sarah Kim is a board-certified medical interpreter specializing in cosmetic and dermatological procedures. With over 12 years of experience helping international patients navigate Korea''s world-class medical system, she has assisted thousands of patients from the US, UK, and Australia. Sarah holds certifications from the Korean Medical Interpretation Association and is fluent in medical terminology across all cosmetic specialties.',
    '김서연은 성형외과 및 피부과 시술 전문 의료통역사입니다. 12년 이상의 경력으로 미국, 영국, 호주 등 영어권 환자분들의 한국 의료 서비스 이용을 도와드리고 있습니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahKim&backgroundColor=b6e3f4',
    '[{"code": "en", "proficiency": "native"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'health-checkup'],
    12,
    ARRAY['TOPIK Level 6', 'Medical Interpreter Certification', 'International Medical Tourism Coordinator'],
    ARRAY['en'],
    'professional',
    'first-person',
    'whatsapp',
    '+82-10-XXXX-XXXX',
    '{"en": "Chat with Sarah on WhatsApp", "ko": "사라에게 왓츠앱으로 문의하기"}'::jsonb,
    60, 400,
    TRUE, TRUE, TRUE, TRUE,
    1
),
(
    'michael-park',
    'Michael Park',
    '박민준',
    'Experienced health checkup coordinator with expertise in preventive medicine and executive wellness programs.',
    '건강검진 및 예방의학 전문 의료 코디네이터입니다.',
    'Michael Park specializes in comprehensive health checkup coordination for international executives and families. With 8 years of experience, he has helped over 2,000 patients navigate Korea''s advanced diagnostic facilities. Michael is particularly skilled at explaining complex medical reports and coordinating follow-up care across borders.',
    '박민준은 8년 경력의 건강검진 전문 코디네이터로, 2,000명 이상의 해외 환자분들을 도와드렸습니다. 복잡한 검진 결과 설명과 사후 관리 조정에 특화되어 있습니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=MichaelPark&backgroundColor=c0aede',
    '[{"code": "en", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}]'::jsonb,
    'health-checkup',
    ARRAY['general-medical', 'orthopedics'],
    8,
    ARRAY['Healthcare Interpreter', 'TOEIC 990'],
    ARRAY['en'],
    'friendly',
    'first-person',
    'whatsapp',
    '+82-10-XXXX-XXXX',
    '{"en": "Message Michael on WhatsApp", "ko": "마이클에게 왓츠앱으로 문의하기"}'::jsonb,
    55, 380,
    TRUE, TRUE, FALSE, TRUE,
    2
),
(
    'emily-lee',
    'Emily Lee',
    '이하은',
    'Dental and orthodontic specialist interpreter with a background in dental hygiene.',
    '치과 및 교정 전문 통역사, 치위생학 전공.',
    'Emily Lee brings a unique perspective to dental interpretation with her background in dental hygiene. Over 6 years, she has assisted patients seeking everything from routine dental care to complex full-mouth reconstructions. Emily is known for her calm demeanor during procedures and her ability to explain technical dental concepts clearly.',
    '이하은은 치위생학을 전공하여 치과 통역에 전문성을 갖추고 있습니다. 6년간 일반 치과 치료부터 전악 재건까지 다양한 시술을 지원해왔습니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=EmilyLee&backgroundColor=d1d4f9',
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dental',
    ARRAY['ophthalmology'],
    6,
    ARRAY['Dental Hygienist License', 'Medical Interpreter Certification'],
    ARRAY['en'],
    'friendly',
    'first-person',
    'whatsapp',
    '+82-10-XXXX-XXXX',
    '{"en": "Contact Emily via WhatsApp", "ko": "에밀리에게 왓츠앱으로 문의하기"}'::jsonb,
    50, 350,
    TRUE, TRUE, FALSE, TRUE,
    3
),

-- ============================================
-- Japanese-speaking Interpreters (ja)
-- ============================================
(
    'yuki-tanaka',
    'Yuki Tanaka',
    '다나카 유키',
    '日本語ネイティブの医療通訳者。美容整形と皮膚科に10年以上の経験。',
    '일본어 원어민 의료통역사. 성형외과와 피부과 10년 이상 경력.',
    'Yuki Tanaka is a native Japanese speaker who has been helping Japanese patients access Korea''s premium medical services for over 10 years. Specializing in cosmetic surgery and dermatology, Yuki understands the unique aesthetic preferences of Japanese patients and ensures clear communication throughout the treatment journey.',
    '다나카 유키는 10년 이상 일본 환자분들의 한국 의료 서비스 이용을 돕고 있는 일본어 원어민 통역사입니다. 성형외과와 피부과를 전문으로 하며, 일본 환자분들의 미적 선호도를 잘 이해하고 있습니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=YukiTanaka&backgroundColor=ffd5dc',
    '[{"code": "ja", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "intermediate"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'hair-transplant'],
    10,
    ARRAY['JLPT N1', 'Medical Interpreter Certification', 'TOPIK Level 5'],
    ARRAY['ja'],
    'professional',
    'first-person',
    'line',
    '@getcarekorea_yuki',
    '{"ja": "LINEでユキに相談する", "ko": "유키에게 라인으로 문의하기", "en": "Chat with Yuki on LINE"}'::jsonb,
    65, 450,
    TRUE, TRUE, TRUE, TRUE,
    1
),
(
    'kenji-suzuki',
    'Kenji Suzuki',
    '스즈키 켄지',
    '健康診断と総合医療の専門通訳。日本の大手企業のエグゼクティブ健診を多数担当。',
    '건강검진 및 종합의료 전문 통역. 일본 대기업 임원 검진 다수 담당.',
    'Kenji Suzuki specializes in executive health checkups and comprehensive medical examinations. Having worked with executives from major Japanese corporations, he understands the importance of discretion and efficiency. Kenji coordinates seamless health checkup experiences at Korea''s top medical facilities.',
    '스즈키 켄지는 임원 건강검진 및 종합검진 전문 통역사입니다. 일본 대기업 임원분들과의 경험을 바탕으로 신속하고 세심한 서비스를 제공합니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=KenjiSuzuki&backgroundColor=a8e6cf',
    '[{"code": "ja", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}]'::jsonb,
    'health-checkup',
    ARRAY['general-medical'],
    7,
    ARRAY['JLPT N1', 'Healthcare Interpreter'],
    ARRAY['ja'],
    'professional',
    'first-person',
    'line',
    '@getcarekorea_kenji',
    '{"ja": "LINEでケンジに相談する", "ko": "켄지에게 라인으로 문의하기"}'::jsonb,
    60, 420,
    TRUE, TRUE, FALSE, TRUE,
    2
),

-- ============================================
-- Chinese (Simplified) Interpreters (zh-CN)
-- ============================================
(
    'wei-zhang',
    'Wei Zhang',
    '张伟',
    '拥有8年医疗翻译经验，专注整形外科和皮肤科领域。',
    '8년 경력의 의료통역사, 성형외과 및 피부과 전문.',
    'Wei Zhang is an experienced medical interpreter serving Chinese patients from mainland China. With 8 years of experience in plastic surgery and dermatology, Wei has helped thousands of patients achieve their aesthetic goals in Korea. He is known for his detailed explanations and patient advocacy.',
    '장웨이는 중국 본토 환자분들을 위한 8년 경력의 의료통역사입니다. 성형외과와 피부과 분야에서 수천 명의 환자분들을 도와드렸습니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=WeiZhang&backgroundColor=ffdfba',
    '[{"code": "zh-CN", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "intermediate"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'dental'],
    8,
    ARRAY['HSK Level 6', 'Medical Interpreter Certification'],
    ARRAY['zh-CN'],
    'professional',
    'first-person',
    'wechat',
    'getcarekorea_wei',
    '{"zh-CN": "微信联系张伟", "ko": "웨이에게 위챗으로 문의하기", "en": "Contact Wei on WeChat"}'::jsonb,
    55, 380,
    TRUE, TRUE, TRUE, TRUE,
    1
),
(
    'mei-chen',
    'Mei Chen',
    '陈美',
    '专业健康体检协调员，熟悉中国患者的需求和文化背景。',
    '건강검진 전문 코디네이터, 중국 환자 문화에 정통.',
    'Mei Chen specializes in coordinating comprehensive health checkups for Chinese patients. Understanding the unique healthcare concerns of Chinese families, she provides culturally sensitive service and detailed explanation of Korean medical technology advantages.',
    '천메이는 중국 환자분들을 위한 건강검진 전문 코디네이터입니다. 중국 가족의 건강 관심사를 이해하고 한국 의료 기술의 장점을 상세히 설명해드립니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=MeiChen&backgroundColor=e2f0cb',
    '[{"code": "zh-CN", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}]'::jsonb,
    'health-checkup',
    ARRAY['fertility', 'general-medical'],
    6,
    ARRAY['HSK Level 6', 'International Medical Tourism Coordinator'],
    ARRAY['zh-CN'],
    'friendly',
    'first-person',
    'wechat',
    'getcarekorea_mei',
    '{"zh-CN": "微信联系陈美", "ko": "메이에게 위챗으로 문의하기"}'::jsonb,
    50, 350,
    TRUE, TRUE, FALSE, TRUE,
    2
),

-- ============================================
-- Chinese (Traditional) Interpreters (zh-TW)
-- ============================================
(
    'ming-liu',
    'Ming Liu',
    '劉明',
    '台灣籍資深醫療口譯員，專精整形外科和皮膚美容領域。',
    '대만 출신 의료통역사, 성형외과 및 피부미용 전문.',
    'Ming Liu is a Taiwan-born medical interpreter with extensive experience serving patients from Taiwan and Hong Kong. Specializing in cosmetic surgery and skin treatments, Ming bridges the gap between patients and Korea''s top aesthetic clinics with his warm and professional approach.',
    '류밍은 대만 출신으로 대만과 홍콩 환자분들을 전문적으로 돕는 의료통역사입니다. 성형외과와 피부 치료 분야에서 따뜻하고 전문적인 서비스를 제공합니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=MingLiu&backgroundColor=dcedc1',
    '[{"code": "zh-TW", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "intermediate"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology'],
    9,
    ARRAY['Traditional Chinese Medical Terminology', 'Medical Interpreter Certification'],
    ARRAY['zh-TW'],
    'professional',
    'first-person',
    'line',
    '@getcarekorea_ming',
    '{"zh-TW": "LINE聯繫劉明", "ko": "밍에게 라인으로 문의하기", "en": "Contact Ming on LINE"}'::jsonb,
    60, 400,
    TRUE, TRUE, TRUE, TRUE,
    1
),

-- ============================================
-- Thai Interpreter (th)
-- ============================================
(
    'somchai-wong',
    'Somchai Wong',
    '솜차이 웡',
    'ล่ามแพทย์ประสบการณ์กว่า 7 ปี เชี่ยวชาญด้านศัลยกรรมตกแต่งและทันตกรรม',
    '7년 경력의 의료통역사, 성형외과 및 치과 전문.',
    'Somchai Wong has been helping Thai patients access Korea''s renowned medical services for over 7 years. With a background in Korean studies and medical interpretation, he specializes in cosmetic surgery and dental procedures, understanding the specific aesthetic preferences of Thai patients.',
    '솜차이 웡은 7년 이상 태국 환자분들의 한국 의료 서비스 이용을 돕고 있습니다. 한국학과 의료통역 배경을 바탕으로 성형외과와 치과 시술을 전문으로 합니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=SomchaiWong&backgroundColor=ffeaa7',
    '[{"code": "th", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "intermediate"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dental', 'dermatology'],
    7,
    ARRAY['Thai-Korean Medical Interpreter', 'TOPIK Level 5'],
    ARRAY['th'],
    'friendly',
    'first-person',
    'line',
    '@getcarekorea_somchai',
    '{"th": "ติดต่อซอมชัยทาง LINE", "ko": "솜차이에게 라인으로 문의하기", "en": "Contact Somchai on LINE"}'::jsonb,
    50, 350,
    TRUE, TRUE, TRUE, TRUE,
    1
),

-- ============================================
-- Mongolian Interpreter (mn)
-- ============================================
(
    'batbayar-bold',
    'Batbayar Bold',
    '바트바야르 볼드',
    'Монгол хэлний эмнэлгийн орчуулагч, 5 жилийн туршлагатай.',
    '5년 경력의 몽골어 의료통역사.',
    'Batbayar Bold is Mongolia''s leading medical interpreter for Korea-bound patients. With 5 years of experience, he has helped hundreds of Mongolian families access quality healthcare in Korea, from health checkups to specialized treatments.',
    '바트바야르 볼드는 5년 경력으로 수백 명의 몽골 가족분들이 한국에서 양질의 의료 서비스를 받을 수 있도록 도와드리고 있습니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=BatbayarBold&backgroundColor=74b9ff',
    '[{"code": "mn", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "intermediate"}]'::jsonb,
    'health-checkup',
    ARRAY['general-medical', 'orthopedics'],
    5,
    ARRAY['Mongolian-Korean Medical Interpreter', 'TOPIK Level 4'],
    ARRAY['mn'],
    'friendly',
    'first-person',
    'whatsapp',
    '+82-10-XXXX-XXXX',
    '{"mn": "WhatsApp-аар холбогдох", "ko": "바트바야르에게 왓츠앱으로 문의하기"}'::jsonb,
    45, 320,
    TRUE, TRUE, TRUE, TRUE,
    1
),

-- ============================================
-- Russian Interpreter (ru)
-- ============================================
(
    'anna-ivanova',
    'Anna Ivanova',
    '안나 이바노바',
    'Профессиональный медицинский переводчик с 6-летним опытом работы.',
    '6년 경력의 전문 러시아어 의료통역사.',
    'Anna Ivanova is a professional Russian medical interpreter with 6 years of experience serving patients from Russia and CIS countries. She specializes in health checkups and cosmetic procedures, providing detailed medical explanations in fluent Russian.',
    '안나 이바노바는 6년 경력으로 러시아 및 CIS 국가 환자분들을 돕는 전문 의료통역사입니다. 건강검진과 미용 시술을 전문으로 합니다.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=AnnaIvanova&backgroundColor=ff7675',
    '[{"code": "ru", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}, {"code": "en", "proficiency": "intermediate"}]'::jsonb,
    'health-checkup',
    ARRAY['plastic-surgery', 'dermatology'],
    6,
    ARRAY['Russian-Korean Medical Interpreter', 'TOPIK Level 5'],
    ARRAY['ru'],
    'professional',
    'first-person',
    'whatsapp',
    '+82-10-XXXX-XXXX',
    '{"ru": "Связаться с Анной в WhatsApp", "ko": "안나에게 왓츠앱으로 문의하기"}'::jsonb,
    50, 350,
    TRUE, TRUE, TRUE, TRUE,
    1
)

ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_ko = EXCLUDED.name_ko,
    bio_short_en = EXCLUDED.bio_short_en,
    bio_short_ko = EXCLUDED.bio_short_ko,
    bio_full_en = EXCLUDED.bio_full_en,
    bio_full_ko = EXCLUDED.bio_full_ko,
    languages = EXCLUDED.languages,
    primary_specialty = EXCLUDED.primary_specialty,
    secondary_specialties = EXCLUDED.secondary_specialties,
    target_locales = EXCLUDED.target_locales,
    preferred_messenger = EXCLUDED.preferred_messenger,
    messenger_cta_text = EXCLUDED.messenger_cta_text,
    is_active = EXCLUDED.is_active,
    is_available = EXCLUDED.is_available,
    is_featured = EXCLUDED.is_featured,
    updated_at = NOW();

-- ============================================
-- Update total_posts count for each author
-- ============================================
UPDATE author_personas ap
SET total_posts = (
    SELECT COUNT(*)
    FROM blog_posts bp
    WHERE bp.author_persona_id = ap.id
    AND bp.status = 'published'
);

-- ============================================
-- Verify insertion
-- ============================================
-- SELECT slug, name_en, target_locales, primary_specialty, preferred_messenger
-- FROM author_personas
-- WHERE is_active = TRUE
-- ORDER BY display_order;
