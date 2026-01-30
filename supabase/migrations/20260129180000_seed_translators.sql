-- Seed Translators from Excel Data
-- Migration: 20260129180000_seed_translators.sql
-- Created: 2026-01-29
-- Updated: Uses JSONB columns (name, bio_short, certifications) after schema refactor
-- Note: target_locales and is_available were removed in 20260129160000_certifications_to_jsonb.sql

-- Insert translators (using JSONB columns)
INSERT INTO author_personas (
    slug,
    name,
    photo_url,
    bio_short,
    years_of_experience,
    languages,
    primary_specialty,
    secondary_specialties,
    certifications,
    is_active,
    writing_tone
) VALUES
-- 1. 이연서
(
    'lee-yeonseo-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이연서", "en": "Lee Yeon-seo"}'::jsonb,
    NULL,
    '{"ko": "전문 의료 통역사입니다. 환자 맞춤형 정밀 통역을 제공합니다."}'::jsonb,
    5,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb,
    TRUE,
    'professional'
),
-- 2. 최춘옥
(
    'choi-chunok-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "최춘옥", "en": "Choi Chun-ok"}'::jsonb,
    NULL,
    '{"ko": "꼼꼼하고 정확한 통역을 제공합니다. 12년 경력의 베테랑 통역사입니다."}'::jsonb,
    12,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb,
    TRUE,
    'professional'
),
-- 3. 김향지
(
    'kim-hyangji-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "김향지", "en": "Kim Hyang-ji"}'::jsonb,
    NULL,
    '{"ko": "다년간의 경험을 바탕으로 신속하게 통역합니다. 특히 중증 질환 통역에 강합니다."}'::jsonb,
    12,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb,
    TRUE,
    'professional'
),
-- 4. 최우
(
    'choi-woo-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "최우", "en": "Choi Woo"}'::jsonb,
    NULL,
    '{"ko": "친절한 태도로 환자의 이해를 돕습니다. 긴장을 풀어주는 노하우를 보유하고 있습니다."}'::jsonb,
    7,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb,
    TRUE,
    'friendly'
),
-- 5. 안소현
(
    'ahn-sohyun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "안소현", "en": "Ahn So-hyun"}'::jsonb,
    NULL,
    '{"ko": "복잡한 의학 용어에도 능숙합니다. 3개 국어(영어, 중국어, 한국어) 능통 통역사."}'::jsonb,
    7,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb,
    TRUE,
    'professional'
),
-- 6. 유지수
(
    'yoo-jisoo-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "유지수", "en": "Yoo Ji-soo"}'::jsonb,
    NULL,
    '{"ko": "통역 전문 자격증을 보유하고 있습니다. 항암 치료 및 내분비 질환 전문 통역."}'::jsonb,
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'oncology',
    ARRAY['endocrinology'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb,
    TRUE,
    'professional'
),
-- 7. 김수아
(
    'kim-sua-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "김수아", "en": "Kim Su-a"}'::jsonb,
    NULL,
    '{"ko": "긴급 상황에서도 침착하게 대처합니다. 응급실 통역 경험 다수."}'::jsonb,
    12,
    '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb,
    TRUE,
    'professional'
),
-- 8. 이지혜
(
    'lee-jihye-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이지혜", "en": "Lee Ji-hye"}'::jsonb,
    NULL,
    '{"ko": "원어민 수준의 언어 구사 능력. 일본 의료계 출신으로 전문성이 높습니다."}'::jsonb,
    12,
    '[{"code": "ja", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification", "Japanese Medical License"]}'::jsonb,
    TRUE,
    'professional'
),
-- 9. 유소이
(
    'yoo-soi-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "유소이", "en": "Yoo So-i"}'::jsonb,
    NULL,
    '{"ko": "성형외과 의료관광 코디네이터 경력. 시술 전후 상담 통역 전문가."}'::jsonb,
    9,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Tourism Coordinator"]}'::jsonb,
    TRUE,
    'friendly'
),
-- 10. 황미연
(
    'hwang-miyeon-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "황미연", "en": "Hwang Mi-yeon"}'::jsonb,
    NULL,
    '{"ko": "의료 통역 (줄기세포치료, 의료관광 등 다양한 분야) 전문."}'::jsonb,
    7,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental', 'stem-cell'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb,
    TRUE,
    'professional'
),
-- 11-41: 나머지 통역사들
(
    'park-sumin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "박수민", "en": "Park Su-min"}'::jsonb, NULL,
    '{"ko": "정확도 99%를 자랑하는 믿을 수 있는 통역. 고객 만족도 최상."}'::jsonb,
    5, '[{"code": "en", "proficiency": "fluent"}, {"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'lee-hwa-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이화", "en": "Lee Hwa"}'::jsonb, NULL,
    '{"ko": "전문 의료 통역사입니다. 정확한 병력 청취 통역에 특화되어 있습니다."}'::jsonb,
    9, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'park-somin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "박소민", "en": "Park So-min"}'::jsonb, NULL,
    '{"ko": "꼼꼼하고 정확한 통역을 제공합니다. 비수술적 치료 분야 전문."}'::jsonb,
    5, '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'jang-mihyun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "장미현", "en": "Jang Mi-hyun"}'::jsonb, NULL,
    '{"ko": "관광통역안내사 출신. 통역과 동시에 관광 안내가 가능합니다."}'::jsonb,
    5, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Tour Guide License", "Medical Interpreter Certification"]}'::jsonb, TRUE, 'friendly'
),
(
    'park-mihee-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "박미희", "en": "Park Mi-hee"}'::jsonb, NULL,
    '{"ko": "친절한 태도로 환자의 이해를 돕습니다. 노인성 질환 통역 전문."}'::jsonb,
    12, '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental', 'geriatrics'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'friendly'
),
(
    'yoon-sua-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "윤수아", "en": "Yoon Su-a"}'::jsonb, NULL,
    '{"ko": "복잡한 의학 용어에도 능숙합니다. 중화권 VIP 고객 전담 통역."}'::jsonb,
    5, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'lee-youngmi-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이영미", "en": "Lee Young-mi"}'::jsonb, NULL,
    '{"ko": "국내, 영어권, 중화권 고객 응대, 중국어 시술 및 상담 통역, 코디네이터 출신."}'::jsonb,
    5, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Tourism Coordinator"]}'::jsonb, TRUE, 'friendly'
),
(
    'kim-dan-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "김단", "en": "Kim Dan"}'::jsonb, NULL,
    '{"ko": "긴급 상황에서도 침착하게 대처합니다. 빠른 상황 판단 능력이 뛰어납니다."}'::jsonb,
    7, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'asano-wakana-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "아사노와카나", "en": "Asano Wakana", "ja": "浅野わかな"}'::jsonb, NULL,
    '{"ko": "원어민 수준의 언어 구사 능력. 일본인 고객에게 신뢰도가 높습니다."}'::jsonb,
    5, '[{"code": "ja", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["JLPT N1", "Medical Interpreter Certification"]}'::jsonb, TRUE, 'friendly'
),
(
    'lee-daeun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이다은", "en": "Lee Da-eun"}'::jsonb, NULL,
    '{"ko": "고객 만족도가 매우 높은 통역사입니다. 섬세한 감정 통역이 가능합니다."}'::jsonb,
    5, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'friendly'
),
(
    'yoon-heejin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "윤희진", "en": "Yoon Hee-jin"}'::jsonb, NULL,
    '{"ko": "정확도 99%를 자랑하는 믿을 수 있는 통역. 문서 번역 및 교정 가능."}'::jsonb,
    5, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification", "Translation Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'moon-hyobing-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "문효빙", "en": "Moon Hyo-bing"}'::jsonb, NULL,
    '{"ko": "친절한 태도로 환자의 이해를 돕습니다. 가족처럼 편안한 통역 제공."}'::jsonb,
    5, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'friendly'
),
(
    'song-minji-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "송민지", "en": "Song Min-ji"}'::jsonb, NULL,
    '{"ko": "복잡한 의학 용어에도 능숙합니다. 최신 의료 트렌드에 밝습니다."}'::jsonb,
    4, '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'yang-dahyung-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "양다형", "en": "Yang Da-hyung"}'::jsonb, NULL,
    '{"ko": "통역 전문 자격증을 보유하고 있습니다. 젊은 감각으로 트렌디한 통역 제공."}'::jsonb,
    4, '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'friendly'
),
(
    'lee-hong-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이홍", "en": "Lee Hong"}'::jsonb, NULL,
    '{"ko": "긴급 상황에서도 침착하게 대처합니다. 7년 경력의 전문 응대 통역사."}'::jsonb,
    7, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'jeon-naeyoung-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "전내영", "en": "Jeon Nae-young"}'::jsonb, NULL,
    '{"ko": "원어민 수준의 언어 구사 능력. 외국인 환자의 문화적 이해도가 높습니다."}'::jsonb,
    7, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'joo-seunghyun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "주승현", "en": "Joo Seung-hyun"}'::jsonb, NULL,
    '{"ko": "24시간 대기 가능한 베테랑 통역사. 시간 제약 없는 신속한 통역."}'::jsonb,
    5, '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'lee-geongu-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이건구", "en": "Lee Geon-gu"}'::jsonb, NULL,
    '{"ko": "의료 관광객 전문 통역 및 안내 서비스 제공. 여행과 통역을 동시에."}'::jsonb,
    5, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Tourism Coordinator", "Tour Guide License"]}'::jsonb, TRUE, 'friendly'
),
(
    'yoon-seola-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "윤설아", "en": "Yoon Seol-a"}'::jsonb, NULL,
    '{"ko": "정확도 99%를 자랑하는 믿을 수 있는 통역. 다국어(스페인, 독일, 영어) 능통."}'::jsonb,
    5, '[{"code": "en", "proficiency": "fluent"}, {"code": "es", "proficiency": "fluent"}, {"code": "de", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification", "Multilingual Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'kwon-eunjin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "권은진", "en": "Kwon Eun-jin"}'::jsonb, NULL, '{}'::jsonb,
    5, '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'kim-hajin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "김하진", "en": "Kim Ha-jin"}'::jsonb, NULL, '{}'::jsonb,
    5, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'bae-hyorin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "배효린", "en": "Bae Hyo-rin"}'::jsonb, NULL, '{}'::jsonb,
    5, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'so-ye-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "소예", "en": "So Ye"}'::jsonb, NULL,
    '{"ko": "부산 통역사"}'::jsonb,
    5, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'friendly'
),
(
    'yeom-ingi-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "염인기", "en": "Yeom In-gi"}'::jsonb, NULL, '{}'::jsonb,
    7, '[{"code": "en", "proficiency": "fluent"}, {"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'lee-gyungsun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이경선", "en": "Lee Gyung-sun"}'::jsonb, NULL, '{}'::jsonb,
    9, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'plastic-surgery', ARRAY['dermatology', 'ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'lee-gilwoo-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이길우", "en": "Lee Gil-woo"}'::jsonb, NULL, '{}'::jsonb,
    5, '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'lee-yoonsu-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "이윤수", "en": "Lee Yoon-su"}'::jsonb, NULL,
    '{"ko": "K-beauty Expo Korea 2025 수출 상담회 바이어 영어 통역, 인천공항 상주 외국인 VIP 통역담당"}'::jsonb,
    5, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'jang-hyunji-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "장현지", "en": "Jang Hyun-ji"}'::jsonb, NULL, '{}'::jsonb,
    5, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'jeon-gyungmi-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "전경미", "en": "Jeon Gyung-mi"}'::jsonb, NULL, '{}'::jsonb,
    7, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'jo-minjung-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "조민정", "en": "Jo Min-jung"}'::jsonb, NULL, '{}'::jsonb,
    7, '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
),
(
    'choi-siyeon-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '{"ko": "최시연", "en": "Choi Si-yeon"}'::jsonb, NULL, '{}'::jsonb,
    5, '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    'dermatology', ARRAY['ophthalmology', 'dental'],
    '{"en": ["Medical Interpreter Certification"]}'::jsonb, TRUE, 'professional'
)
ON CONFLICT (slug) DO NOTHING;

-- Update stats
SELECT COUNT(*) as total_translators FROM author_personas WHERE is_active = TRUE;
