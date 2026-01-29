-- Seed Translators from Excel Data
-- Migration: 20260129180000_seed_translators.sql
-- Created: 2026-01-29

-- Helper function to generate slug from Korean name
CREATE OR REPLACE FUNCTION generate_slug_from_korean(name_ko TEXT) RETURNS TEXT AS $$
DECLARE
    clean_name TEXT;
    slug TEXT;
BEGIN
    -- Remove spaces and special characters, lowercase
    clean_name := LOWER(REGEXP_REPLACE(name_ko, '[^가-힣a-zA-Z0-9]', '', 'g'));
    -- Create a unique slug using name + random suffix
    slug := clean_name || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Insert translators
INSERT INTO author_personas (
    slug,
    name_ko,
    name_en,
    photo_url,
    bio_short_ko,
    years_of_experience,
    languages,
    target_locales,
    primary_specialty,
    secondary_specialties,
    certifications,
    is_active,
    is_available,
    writing_tone
) VALUES
-- 1. 이연서
(
    'lee-yeonseo-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이연서',
    'Lee Yeon-seo',
    NULL,
    '전문 의료 통역사입니다. 환자 맞춤형 정밀 통역을 제공합니다.',
    5,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 2. 최춘옥
(
    'choi-chunok-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '최춘옥',
    'Choi Chun-ok',
    NULL,
    '꼼꼼하고 정확한 통역을 제공합니다. 12년 경력의 베테랑 통역사입니다.',
    12,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 3. 김향지
(
    'kim-hyangji-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '김향지',
    'Kim Hyang-ji',
    NULL,
    '다년간의 경험을 바탕으로 신속하게 통역합니다. 특히 중증 질환 통역에 강합니다.',
    12,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 4. 최우
(
    'choi-woo-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '최우',
    'Choi Woo',
    NULL,
    '친절한 태도로 환자의 이해를 돕습니다. 긴장을 풀어주는 노하우를 보유하고 있습니다.',
    7,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'friendly'
),
-- 5. 안소현
(
    'ahn-sohyun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '안소현',
    'Ahn So-hyun',
    NULL,
    '복잡한 의학 용어에도 능숙합니다. 3개 국어(영어, 중국어, 한국어) 능통 통역사.',
    7,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en', 'zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 6. 유지수
(
    'yoo-jisoo-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '유지수',
    'Yoo Ji-soo',
    NULL,
    '통역 전문 자격증을 보유하고 있습니다. 항암 치료 및 내분비 질환 전문 통역.',
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'oncology',
    ARRAY['endocrinology'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 7. 김수아
(
    'kim-sua-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '김수아',
    'Kim Su-a',
    NULL,
    '긴급 상황에서도 침착하게 대처합니다. 응급실 통역 경험 다수.',
    12,
    '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['ja'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 8. 이지혜
(
    'lee-jihye-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이지혜',
    'Lee Ji-hye',
    NULL,
    '원어민 수준의 언어 구사 능력. 일본 의료계 출신으로 전문성이 높습니다.',
    12,
    '[{"code": "ja", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}]'::jsonb,
    ARRAY['ja'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification', 'Japanese Medical License'],
    TRUE,
    TRUE,
    'professional'
),
-- 9. 유소이
(
    'yoo-soi-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '유소이',
    'Yoo So-i',
    NULL,
    '성형외과 의료관광 코디네이터 경력. 시술 전후 상담 통역 전문가.',
    9,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Tourism Coordinator'],
    TRUE,
    TRUE,
    'friendly'
),
-- 10. 황미연
(
    'hwang-miyeon-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '황미연',
    'Hwang Mi-yeon',
    NULL,
    '의료 통역 (줄기세포치료, 의료관광 등 다양한 분야) 전문.',
    7,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental', 'stem-cell'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 11. 박수민
(
    'park-sumin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '박수민',
    'Park Su-min',
    NULL,
    '정확도 99%를 자랑하는 믿을 수 있는 통역. 고객 만족도 최상.',
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en', 'zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 12. 이화
(
    'lee-hwa-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이화',
    'Lee Hwa',
    NULL,
    '전문 의료 통역사입니다. 정확한 병력 청취 통역에 특화되어 있습니다.',
    9,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 13. 박소민
(
    'park-somin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '박소민',
    'Park So-min',
    NULL,
    '꼼꼼하고 정확한 통역을 제공합니다. 비수술적 치료 분야 전문.',
    5,
    '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['ja'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 14. 장미현
(
    'jang-mihyun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '장미현',
    'Jang Mi-hyun',
    NULL,
    '관광통역안내사 출신. 통역과 동시에 관광 안내가 가능합니다.',
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Tour Guide License', 'Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'friendly'
),
-- 15. 박미희
(
    'park-mihee-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '박미희',
    'Park Mi-hee',
    NULL,
    '친절한 태도로 환자의 이해를 돕습니다. 노인성 질환 통역 전문.',
    12,
    '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['ja'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental', 'geriatrics'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'friendly'
),
-- 16. 윤수아
(
    'yoon-sua-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '윤수아',
    'Yoon Su-a',
    NULL,
    '복잡한 의학 용어에도 능숙합니다. 중화권 VIP 고객 전담 통역.',
    5,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 17. 이영미
(
    'lee-youngmi-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이영미',
    'Lee Young-mi',
    NULL,
    '국내, 영어권, 중화권 고객 응대, 중국어 시술 및 상담 통역, 코디네이터 출신.',
    5,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Tourism Coordinator'],
    TRUE,
    TRUE,
    'friendly'
),
-- 18. 김단
(
    'kim-dan-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '김단',
    'Kim Dan',
    NULL,
    '긴급 상황에서도 침착하게 대처합니다. 빠른 상황 판단 능력이 뛰어납니다.',
    7,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 19. 아사노와카나
(
    'asano-wakana-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '아사노와카나',
    'Asano Wakana',
    NULL,
    '원어민 수준의 언어 구사 능력. 일본인 고객에게 신뢰도가 높습니다.',
    5,
    '[{"code": "ja", "proficiency": "native"}, {"code": "ko", "proficiency": "fluent"}]'::jsonb,
    ARRAY['ja'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['JLPT N1', 'Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'friendly'
),
-- 20. 이다은
(
    'lee-daeun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이다은',
    'Lee Da-eun',
    NULL,
    '고객 만족도가 매우 높은 통역사입니다. 섬세한 감정 통역이 가능합니다.',
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'friendly'
),
-- 21. 윤희진
(
    'yoon-heejin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '윤희진',
    'Yoon Hee-jin',
    NULL,
    '정확도 99%를 자랑하는 믿을 수 있는 통역. 문서 번역 및 교정 가능.',
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification', 'Translation Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 22. 문효빙
(
    'moon-hyobing-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '문효빙',
    'Moon Hyo-bing',
    NULL,
    '친절한 태도로 환자의 이해를 돕습니다. 가족처럼 편안한 통역 제공.',
    5,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'friendly'
),
-- 23. 송민지
(
    'song-minji-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '송민지',
    'Song Min-ji',
    NULL,
    '복잡한 의학 용어에도 능숙합니다. 최신 의료 트렌드에 밝습니다.',
    4,
    '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['ja'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 24. 양다형
(
    'yang-dahyung-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '양다형',
    'Yang Da-hyung',
    NULL,
    '통역 전문 자격증을 보유하고 있습니다. 젊은 감각으로 트렌디한 통역 제공.',
    4,
    '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['ja'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'friendly'
),
-- 25. 이홍
(
    'lee-hong-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이홍',
    'Lee Hong',
    NULL,
    '긴급 상황에서도 침착하게 대처합니다. 7년 경력의 전문 응대 통역사.',
    7,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 26. 전내영
(
    'jeon-naeyoung-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '전내영',
    'Jeon Nae-young',
    NULL,
    '원어민 수준의 언어 구사 능력. 외국인 환자의 문화적 이해도가 높습니다.',
    7,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 27. 주승현
(
    'joo-seunghyun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '주승현',
    'Joo Seung-hyun',
    NULL,
    '24시간 대기 가능한 베테랑 통역사. 시간 제약 없는 신속한 통역.',
    5,
    '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['ja'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 28. 이건구
(
    'lee-geongu-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이건구',
    'Lee Geon-gu',
    NULL,
    '의료 관광객 전문 통역 및 안내 서비스 제공. 여행과 통역을 동시에.',
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Tourism Coordinator', 'Tour Guide License'],
    TRUE,
    TRUE,
    'friendly'
),
-- 29. 윤설아
(
    'yoon-seola-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '윤설아',
    'Yoon Seol-a',
    NULL,
    '정확도 99%를 자랑하는 믿을 수 있는 통역. 다국어(스페인, 독일, 영어) 능통.',
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "es", "proficiency": "fluent"}, {"code": "de", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification', 'Multilingual Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 30. 권은진
(
    'kwon-eunjin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '권은진',
    'Kwon Eun-jin',
    NULL,
    NULL,
    5,
    '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['ja'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 31. 김하진
(
    'kim-hajin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '김하진',
    'Kim Ha-jin',
    NULL,
    NULL,
    5,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 32. 배효린
(
    'bae-hyorin-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '배효린',
    'Bae Hyo-rin',
    NULL,
    NULL,
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 33. 소예
(
    'so-ye-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '소예',
    'So Ye',
    NULL,
    '부산 통역사',
    5,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'friendly'
),
-- 34. 염인기
(
    'yeom-ingi-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '염인기',
    'Yeom In-gi',
    NULL,
    NULL,
    7,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en', 'zh-CN', 'zh-TW'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 35. 이경선
(
    'lee-gyungsun-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이경선',
    'Lee Gyung-sun',
    NULL,
    NULL,
    9,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'plastic-surgery',
    ARRAY['dermatology', 'ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 36. 이길우
(
    'lee-gilwoo-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이길우',
    'Lee Gil-woo',
    NULL,
    NULL,
    5,
    '[{"code": "ja", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['ja'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 37. 이윤수
(
    'lee-yoonsu-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '이윤수',
    'Lee Yoon-su',
    NULL,
    'K-beauty Expo Korea 2025 수출 상담회 바이어 영어 통역, 인천공항 상주 외국인 VIP 통역담당',
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 38. 장현지
(
    'jang-hyunji-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '장현지',
    'Jang Hyun-ji',
    NULL,
    NULL,
    5,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 39. 전경미
(
    'jeon-gyungmi-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '전경미',
    'Jeon Gyung-mi',
    NULL,
    NULL,
    7,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 40. 조민정
(
    'jo-minjung-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '조민정',
    'Jo Min-jung',
    NULL,
    NULL,
    7,
    '[{"code": "en", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['en'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
),
-- 41. 최시연
(
    'choi-siyeon-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4),
    '최시연',
    'Choi Si-yeon',
    NULL,
    NULL,
    5,
    '[{"code": "zh-CN", "proficiency": "fluent"}, {"code": "ko", "proficiency": "native"}]'::jsonb,
    ARRAY['zh-CN', 'zh-TW'],
    'dermatology',
    ARRAY['ophthalmology', 'dental'],
    ARRAY['Medical Interpreter Certification'],
    TRUE,
    TRUE,
    'professional'
)
ON CONFLICT (slug) DO NOTHING;

-- Clean up helper function
DROP FUNCTION IF EXISTS generate_slug_from_korean(TEXT);

-- Update stats
SELECT COUNT(*) as total_translators FROM author_personas WHERE is_active = TRUE;
