-- GetCareKorea Database Migration
-- 012: Procedures & Hospitals Enhancement
-- Created: 2026-01-23
-- Purpose: Add missing columns and seed comprehensive procedures/hospitals data

-- ============================================
-- PART 1: Add missing columns to procedures table
-- ============================================

-- Add Korean name column (missing in original schema)
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS name_ko TEXT;

-- Add short description columns for all locales
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS short_description_en TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS short_description_ko TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS short_description_zh_tw TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS short_description_zh_cn TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS short_description_ja TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS short_description_th TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS short_description_mn TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS short_description_ru TEXT;

-- Add description_ko (missing in original schema)
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS description_ko TEXT;

-- Add new columns for procedures listing
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS price_range_usd TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS recovery_time TEXT;

-- Make hospital_id nullable for standalone procedures
ALTER TABLE procedures ALTER COLUMN hospital_id DROP NOT NULL;

-- Drop the unique constraint on (hospital_id, slug) if it exists
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS procedures_hospital_id_slug_key;

-- Add unique constraint on slug alone
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'procedures_slug_unique'
    ) THEN
        ALTER TABLE procedures ADD CONSTRAINT procedures_slug_unique UNIQUE (slug);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PART 2: Add missing columns to hospitals table
-- ============================================

-- Add Korean name column (missing in original schema)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS name_ko TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS description_ko TEXT;

-- Add district for more detailed location
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS district TEXT;

-- ============================================
-- PART 3: Create indexes for new columns
-- ============================================

-- Procedures indexes
CREATE INDEX IF NOT EXISTS idx_procedures_active ON procedures(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_procedures_display_order ON procedures(display_order);
CREATE INDEX IF NOT EXISTS idx_procedures_popularity ON procedures(popularity_score DESC);

-- ============================================
-- PART 4: Create hospital_procedures junction table
-- ============================================

CREATE TABLE IF NOT EXISTS hospital_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
    price_range TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hospital_id, procedure_id)
);

CREATE INDEX IF NOT EXISTS idx_hospital_procedures_hospital ON hospital_procedures(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_procedures_procedure ON hospital_procedures(procedure_id);
CREATE INDEX IF NOT EXISTS idx_hospital_procedures_featured ON hospital_procedures(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- PART 5: Seed Comprehensive Procedures Data
-- ============================================

-- Plastic Surgery Procedures
INSERT INTO procedures (slug, category, name_en, name_ko, name_ja, name_zh_cn, name_zh_tw, name_th, name_mn, name_ru, short_description_en, short_description_ko, description_en, image_url, price_range_usd, duration_minutes, recovery_days, recovery_time, is_active, display_order, popularity_score)
VALUES
-- Rhinoplasty
('rhinoplasty', 'plastic-surgery', 'Rhinoplasty (Nose Job)', '코성형 (코수술)', '鼻整形', '鼻整形手术', '鼻整形手術', 'ศัลยกรรมจมูก', 'Хамрын мэс засал', 'Ринопластика',
'Reshape your nose for natural-looking results with Korea''s top surgeons.',
'자연스러운 결과를 위한 한국 최고 전문의의 코성형',
'Korean rhinoplasty is world-renowned for achieving natural, balanced results. Our partner clinics use advanced techniques including alar base reduction, tip plasty, and dorsal augmentation with customized implants or autologous cartilage.',
'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800', '$2,000 - $8,000', 120, 14, '1-2 weeks', TRUE, 1, 98),

-- Double Eyelid Surgery
('double-eyelid-surgery', 'plastic-surgery', 'Double Eyelid Surgery', '쌍꺼풀 수술', '二重まぶた手術', '双眼皮手术', '雙眼皮手術', 'ทำตาสองชั้น', 'Давхар зовхины мэс засал', 'Блефаропластика',
'Create natural double eyelids with minimal scarring.',
'최소 흉터로 자연스러운 쌍꺼풀 형성',
'The most popular cosmetic procedure in Korea. Choose from incisional or non-incisional (burial) methods based on your eyelid structure for permanent, natural-looking results.',
'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800', '$1,500 - $4,000', 60, 7, '1 week', TRUE, 2, 96),

-- Facial Contouring / V-Line Surgery
('facial-contouring', 'plastic-surgery', 'Facial Contouring (V-Line)', '안면윤곽 (V라인)', '輪郭形成術', '面部轮廓整形', '面部輪廓整形', 'ปรับโครงหน้า V-Line', 'Царайны хэлбэр засах', 'Контурная пластика лица',
'Achieve the coveted V-line face shape with bone surgery.',
'뼈 수술로 브이라인 얼굴형 완성',
'Comprehensive facial contouring including square jaw reduction, chin reshaping, and cheekbone reduction. Korean surgeons are recognized globally for safe, dramatic transformations.',
'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800', '$5,000 - $15,000', 240, 28, '3-4 weeks', TRUE, 3, 94),

-- Fat Grafting / Fat Transfer
('fat-grafting', 'plastic-surgery', 'Fat Grafting (Fat Transfer)', '지방이식', '脂肪注入', '脂肪移植', '脂肪移植', 'ฉีดไขมัน', 'Өөхний шилжүүлэн суулгалт', 'Липофилинг',
'Natural volume enhancement using your own fat.',
'본인 지방을 이용한 자연스러운 볼륨 증가',
'Harvest fat from areas like abdomen or thighs and inject into face or body for natural volume. Popular for forehead, cheeks, and under-eye hollows.',
'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', '$2,000 - $6,000', 90, 14, '2 weeks', TRUE, 4, 88),

-- Breast Augmentation
('breast-augmentation', 'plastic-surgery', 'Breast Augmentation', '가슴 확대술', '豊胸手術', '隆胸手术', '隆胸手術', 'เสริมหน้าอก', 'Хөхний томруулах мэс засал', 'Увеличение груди',
'Enhance breast size and shape with safe implants.',
'안전한 보형물로 가슴 사이즈와 형태 개선',
'Korean breast augmentation focuses on natural-looking results with the latest cohesive silicone gel implants. Options include round or teardrop shapes with various incision locations.',
'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', '$4,000 - $10,000', 120, 21, '2-3 weeks', TRUE, 5, 85),

-- Liposuction
('liposuction', 'plastic-surgery', 'Liposuction', '지방흡입', '脂肪吸引', '吸脂手术', '抽脂手術', 'ดูดไขมัน', 'Өөх соруулах', 'Липосакция',
'Remove stubborn fat deposits for a slimmer contour.',
'완고한 지방 제거로 날씬한 바디라인',
'Advanced techniques including VASER, waterjet-assisted, and laser liposuction for precise fat removal with minimal recovery time.',
'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', '$3,000 - $8,000', 120, 14, '1-2 weeks', TRUE, 6, 82),

-- Facelift
('facelift', 'plastic-surgery', 'Facelift (Face Lift)', '안면거상술', 'フェイスリフト', '面部拉皮', '面部拉皮', 'ดึงหน้า', 'Нүүр сэргээх', 'Подтяжка лица',
'Turn back time with comprehensive facial rejuvenation.',
'포괄적인 안면 리프팅으로 젊음 회복',
'Korean facelift techniques focus on natural results with SMAS layer tightening, minimal scarring, and faster recovery.',
'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', '$8,000 - $20,000', 240, 21, '2-3 weeks', TRUE, 7, 78),

-- Dermatology Procedures
('skin-rejuvenation', 'dermatology', 'Skin Rejuvenation (Laser)', '피부 재생 (레이저)', 'レーザー治療', '皮肤激光治疗', '皮膚雷射治療', 'เลเซอร์ผิว', 'Арьс сэргээх лазер', 'Омоложение кожи',
'Advanced laser treatments for youthful, glowing skin.',
'젊고 빛나는 피부를 위한 첨단 레이저 치료',
'Comprehensive laser treatments including fractional CO2, Picosure, and V-beam for wrinkles, scars, pigmentation, and overall skin texture improvement.',
'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', '$200 - $2,000', 60, 3, '0-7 days', TRUE, 8, 92),

('botox-fillers', 'dermatology', 'Botox & Fillers', '보톡스 & 필러', 'ボトックス・フィラー', '肉毒素和填充剂', '肉毒桿菌和填充劑', 'โบท็อกซ์และฟิลเลอร์', 'Ботокс & Филлер', 'Ботокс и филлеры',
'Non-surgical wrinkle treatment and volume restoration.',
'비수술적 주름 치료 및 볼륨 회복',
'Expert injections using premium products like Botox, Dysport, Juvederm, and Restylane for wrinkle reduction, facial contouring, and volume enhancement.',
'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800', '$300 - $1,500', 30, 0, 'Same day', TRUE, 9, 90),

-- Dental Procedures
('dental-implants', 'dental', 'Dental Implants', '치과 임플란트', 'デンタルインプラント', '牙科种植体', '牙科植體', 'รากฟันเทียม', 'Шүдний имплант', 'Зубные импланты',
'Permanent tooth replacement with premium implants.',
'프리미엄 임플란트로 영구적인 치아 대체',
'High-quality dental implants from leading Korean and European brands with experienced specialists and comprehensive aftercare.',
'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800', '$1,000 - $3,000', 90, 7, '1-2 weeks', TRUE, 10, 88),

('teeth-whitening', 'dental', 'Teeth Whitening', '치아 미백', 'ホワイトニング', '牙齿美白', '牙齒美白', 'ฟอกสีฟัน', 'Шүд цайруулах', 'Отбеливание зубов',
'Professional whitening for a brighter smile.',
'밝은 미소를 위한 전문 미백',
'In-office and take-home whitening options using the latest technology for safe, effective results up to 8 shades whiter.',
'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800', '$300 - $800', 60, 0, 'Same day', TRUE, 11, 85),

('veneers', 'dental', 'Dental Veneers', '라미네이트 (베니어)', 'ラミネートベニア', '牙贴面', '牙貼片', 'วีเนียร์', 'Шүдний бүрээс', 'Виниры',
'Transform your smile with custom porcelain veneers.',
'맞춤 포슬린 베니어로 미소 변신',
'Premium porcelain veneers designed to match your natural teeth color and shape for a perfect Hollywood smile.',
'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800', '$500 - $1,500', 120, 3, '1-3 days', TRUE, 12, 82),

-- Ophthalmology Procedures
('lasik-surgery', 'ophthalmology', 'LASIK Eye Surgery', '라식 수술', 'レーシック手術', '激光近视手术', '雷射近視手術', 'ผ่าตัดสายตาเลสิก', 'LASIK мэс засал', 'Лазерная коррекция зрения',
'Permanent vision correction with advanced laser technology.',
'첨단 레이저 기술로 영구적인 시력 교정',
'Korea''s leading eye clinics offer LASIK, LASEK, and SMILE procedures with the latest femtosecond laser technology for safe, precise vision correction.',
'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800', '$1,500 - $4,000', 30, 3, '1-3 days', TRUE, 13, 85),

('cataract-surgery', 'ophthalmology', 'Cataract Surgery', '백내장 수술', '白内障手術', '白内障手术', '白內障手術', 'ผ่าตัดต้อกระจก', 'Нүдний булингар авах', 'Удаление катаракты',
'Clear vision restoration with premium lens implants.',
'프리미엄 인공수정체로 맑은 시력 회복',
'Advanced cataract surgery with multifocal and extended depth of focus (EDOF) lens options for glasses-free vision.',
'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800', '$2,000 - $5,000', 30, 7, '1 week', TRUE, 14, 75),

-- Hair Transplant Procedures
('fue-hair-transplant', 'hair-transplant', 'FUE Hair Transplant', 'FUE 모발이식', 'FUE植毛', 'FUE毛发移植', 'FUE毛髮移植', 'ปลูกผม FUE', 'FUE үс шилжүүлэн суулгах', 'Пересадка волос FUE',
'Natural hair restoration with follicular unit extraction.',
'모낭 단위 추출로 자연스러운 모발 복원',
'Minimally invasive FUE technique extracting individual follicles for natural hairline restoration with no linear scarring.',
'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', '$4,000 - $12,000', 480, 10, '7-14 days', TRUE, 15, 82),

('dhi-hair-transplant', 'hair-transplant', 'DHI Hair Transplant', 'DHI 모발이식', 'DHI植毛', 'DHI毛发移植', 'DHI毛髮移植', 'ปลูกผม DHI', 'DHI үс шилжүүлэн суулгах', 'Пересадка волос DHI',
'Direct hair implantation for denser, more precise results.',
'더 밀도 높고 정밀한 결과를 위한 직접 모발 이식',
'Advanced DHI technique using Choi Implanter Pen for direct implantation without creating channels first, allowing higher density.',
'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', '$5,000 - $15,000', 540, 10, '7-14 days', TRUE, 16, 80),

-- Health Checkup
('comprehensive-health-checkup', 'health-checkup', 'Comprehensive Health Checkup', '종합 건강검진', '人間ドック', '全面健康检查', '全面健康檢查', 'ตรวจสุขภาพแบบครบถ้วน', 'Иж бүрэн эрүүл мэндийн үзлэг', 'Комплексное обследование',
'Complete health screening with advanced diagnostics.',
'첨단 진단 장비를 활용한 종합 건강 검진',
'Premium health checkup packages including MRI, CT, ultrasound, blood tests, cancer markers, cardiac screening, and specialist consultations.',
'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', '$500 - $3,000', 240, 0, 'Same day', TRUE, 17, 90),

('cancer-screening', 'health-checkup', 'Cancer Screening', '암 검진', 'がん検診', '癌症筛查', '癌症篩檢', 'ตรวจคัดกรองมะเร็ง', 'Хорт хавдрын шинжилгээ', 'Онкологический скрининг',
'Early detection screening for major cancer types.',
'주요 암 조기 발견을 위한 검진',
'Comprehensive cancer screening including PET-CT, tumor markers, colonoscopy, gastroscopy, and specialized imaging.',
'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', '$1,000 - $5,000', 360, 1, '1-2 days', TRUE, 18, 85),

-- Fertility Procedures
('ivf-treatment', 'fertility', 'IVF Treatment', 'IVF 시술 (시험관 아기)', '体外受精', '试管婴儿', '試管嬰兒', 'ทำเด็กหลอดแก้ว', 'IVF эмчилгээ', 'ЭКО',
'World-class in vitro fertilization with high success rates.',
'높은 성공률의 세계적 수준의 체외 수정',
'Korea''s leading fertility centers offer comprehensive IVF programs with advanced embryo culture, genetic testing (PGT), and frozen embryo transfer options.',
'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800', '$5,000 - $15,000', NULL, 14, 'Varies', TRUE, 19, 78),

('egg-freezing', 'fertility', 'Egg Freezing', '난자 동결', '卵子凍結', '冻卵', '凍卵', 'แช่แข็งไข่', 'Өндгөн эс хөлдөөх', 'Заморозка яйцеклеток',
'Preserve your fertility for the future.',
'미래를 위한 가임력 보존',
'State-of-the-art vitrification technology for optimal egg preservation with comprehensive hormone monitoring and retrieval procedures.',
'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800', '$3,000 - $8,000', 60, 3, '2-3 days', TRUE, 20, 75),

-- Orthopedics Procedures
('knee-replacement', 'orthopedics', 'Knee Replacement Surgery', '무릎 인공관절 수술', '膝関節置換術', '膝关节置换术', '膝關節置換術', 'ผ่าตัดเปลี่ยนข้อเข่า', 'Өвдөг солих мэс засал', 'Эндопротезирование колена',
'Restore mobility with advanced joint replacement.',
'첨단 관절 치환으로 이동성 회복',
'Minimally invasive knee replacement using robotic-assisted surgery and premium implants from leading manufacturers.',
'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', '$10,000 - $20,000', 180, 42, '4-6 weeks', TRUE, 21, 72),

('spine-surgery', 'orthopedics', 'Spine Surgery', '척추 수술', '脊椎手術', '脊柱手术', '脊椎手術', 'ผ่าตัดกระดูกสันหลัง', 'Нуруу засах мэс засал', 'Операция на позвоночнике',
'Expert spinal procedures for lasting pain relief.',
'지속적인 통증 완화를 위한 전문 척추 시술',
'Comprehensive spine treatments including minimally invasive disc surgery, fusion, and decompression procedures.',
'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', '$8,000 - $25,000', 240, 56, '6-8 weeks', TRUE, 22, 70),

-- Additional Popular Procedures
('thread-lift', 'dermatology', 'Thread Lift', '실리프팅', '糸リフト', '线雕提升', '線雕提升', 'ร้อยไหม', 'Утасны лифт', 'Нитевой лифтинг',
'Non-surgical facelift with absorbable threads.',
'흡수성 실을 이용한 비수술적 리프팅',
'PDO, PCL, and PLLA threads for immediate lifting effect with collagen stimulation for long-lasting results.',
'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', '$1,000 - $4,000', 60, 7, '3-7 days', TRUE, 23, 88),

('laser-hair-removal', 'dermatology', 'Laser Hair Removal', '레이저 제모', 'レーザー脱毛', '激光脱毛', '雷射除毛', 'กำจัดขนด้วยเลเซอร์', 'Лазерээр үс арилгах', 'Лазерная эпиляция',
'Permanent hair reduction with advanced lasers.',
'첨단 레이저로 영구적인 제모',
'Safe and effective laser hair removal for all skin types using the latest Alexandrite, Diode, and Nd:YAG lasers.',
'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', '$100 - $500', 30, 0, 'Same day', TRUE, 24, 85),

('blepharoplasty', 'plastic-surgery', 'Blepharoplasty (Eyelid Surgery)', '눈성형 (눈매교정)', '眼瞼形成術', '眼睑整形', '眼瞼整形', 'ศัลยกรรมตา', 'Зовхины мэс засал', 'Блефаропластика',
'Rejuvenate your eyes by removing excess skin and fat.',
'과도한 피부와 지방 제거로 눈 젊어지게',
'Upper and lower blepharoplasty to address droopy eyelids, under-eye bags, and achieve a more youthful, alert appearance.',
'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800', '$2,000 - $5,000', 90, 10, '1-2 weeks', TRUE, 25, 84)

ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_ko = EXCLUDED.name_ko,
    name_ja = EXCLUDED.name_ja,
    name_zh_cn = EXCLUDED.name_zh_cn,
    name_zh_tw = EXCLUDED.name_zh_tw,
    name_th = EXCLUDED.name_th,
    name_mn = EXCLUDED.name_mn,
    name_ru = EXCLUDED.name_ru,
    short_description_en = EXCLUDED.short_description_en,
    short_description_ko = EXCLUDED.short_description_ko,
    description_en = EXCLUDED.description_en,
    image_url = EXCLUDED.image_url,
    price_range_usd = EXCLUDED.price_range_usd,
    duration_minutes = EXCLUDED.duration_minutes,
    recovery_days = EXCLUDED.recovery_days,
    recovery_time = EXCLUDED.recovery_time,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order,
    popularity_score = EXCLUDED.popularity_score;

-- ============================================
-- PART 6: Seed Hospitals Data
-- ============================================

-- Insert hospitals with comprehensive data
INSERT INTO hospitals (slug, name_en, name_ko, name_ja, name_zh_cn, name_zh_tw, name_th, name_mn, name_ru, description_en, description_ko, logo_url, cover_image_url, address, city, district, phone, email, website, specialties, languages, certifications, has_cctv, has_female_doctor, avg_rating, review_count, is_featured, is_verified, status)
VALUES
-- Premium Plastic Surgery Hospitals
('grand-plastic-surgery', 'Grand Plastic Surgery', '그랜드 성형외과', 'グランド整形外科', '格兰德整形外科', '格蘭德整形外科', 'Grand Plastic Surgery', 'Гранд гоо сайхны мэс засал', 'Гранд Пластическая Хирургия',
'Korea''s premier plastic surgery clinic in Gangnam with 20+ years of experience. Specialized in facial contouring, rhinoplasty, and comprehensive plastic surgery procedures with JCI accreditation.',
'20년 이상의 경험을 가진 강남 최고의 성형외과. JCI 인증, 안면윤곽, 코성형 및 종합 성형수술 전문.',
'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop',
'123 Gangnam-daero, Gangnam-gu', 'Seoul', 'Gangnam',
'+82-2-1234-5678', 'contact@grandps.com', 'https://grandps.com',
ARRAY['Plastic Surgery', 'Rhinoplasty', 'Facial Contouring', 'Breast Surgery'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean'],
ARRAY['JCI', 'KFDA'],
TRUE, TRUE, 4.9, 1250, TRUE, TRUE, 'published'),

('seoul-aesthetic-clinic', 'Seoul Aesthetic Clinic', '서울에스테틱클리닉', 'ソウル美容クリニック', '首尔美容诊所', '首爾美容診所', 'Seoul Aesthetic Clinic', 'Сөүл гоо сайхны эмнэлэг', 'Сеульская Эстетическая Клиника',
'Boutique aesthetic clinic specializing in natural-looking enhancements. Famous for double eyelid surgery and non-invasive procedures.',
'자연스러운 향상을 전문으로 하는 부티크 에스테틱 클리닉. 쌍꺼풀 수술과 비침습적 시술로 유명.',
'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=800&fit=crop',
'456 Apgujeong-ro, Gangnam-gu', 'Seoul', 'Apgujeong',
'+82-2-2345-6789', 'info@seoulaesthetic.com', 'https://seoulaesthetic.com',
ARRAY['Plastic Surgery', 'Dermatology', 'Anti-aging'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean', 'Russian'],
ARRAY['JCI'],
TRUE, TRUE, 4.8, 980, TRUE, TRUE, 'published'),

-- Health Checkup Centers
('seoul-wellness-center', 'Seoul Wellness Center', '서울웰니스센터', 'ソウルウェルネスセンター', '首尔健康中心', '首爾健康中心', 'Seoul Wellness Center', 'Сөүл эрүүл мэндийн төв', 'Сеульский Велнес Центр',
'Comprehensive health checkup center with state-of-the-art diagnostics. Premium screening packages with same-day results and VIP services.',
'최첨단 진단 장비를 갖춘 종합 건강검진 센터. 당일 결과 및 VIP 서비스가 포함된 프리미엄 검진 패키지.',
'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=800&fit=crop',
'789 Myeongdong-gil, Jung-gu', 'Seoul', 'Myeongdong',
'+82-2-3456-7890', 'checkup@seoulwellness.com', 'https://seoulwellness.com',
ARRAY['Health Checkup', 'Internal Medicine', 'Cancer Screening'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Vietnamese'],
ARRAY['JCI', 'KHA'],
TRUE, TRUE, 4.8, 890, TRUE, TRUE, 'published'),

-- Dental Clinics
('smile-dental-korea', 'Smile Dental Korea', '스마일치과', 'スマイル歯科', '微笑牙科', '微笑牙科', 'Smile Dental Korea', 'Smile шүдний эмнэлэг', 'Смайл Дентал Корея',
'Award-winning dental clinic specializing in implants, veneers, and orthodontics. State-of-the-art equipment with bilingual staff.',
'임플란트, 베니어, 교정 전문 수상 경력의 치과. 이중 언어 직원과 최첨단 장비.',
'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=800&fit=crop',
'321 Sinsa-dong, Gangnam-gu', 'Seoul', 'Sinsa',
'+82-2-4567-8901', 'smile@smiledental.kr', 'https://smiledental.kr',
ARRAY['Dental', 'Implants', 'Orthodontics', 'Cosmetic Dentistry'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean', 'Thai'],
ARRAY['JCI'],
TRUE, FALSE, 4.9, 2100, TRUE, TRUE, 'published'),

-- Eye Centers
('gangnam-eye-center', 'Gangnam Eye Center', '강남안과센터', '江南眼科センター', '江南眼科中心', '江南眼科中心', 'Gangnam Eye Center', 'Гангнам нүдний төв', 'Глазной Центр Гангнам',
'Leading LASIK and vision correction center with over 50,000 successful procedures. Advanced laser technology and experienced surgeons.',
'50,000건 이상의 성공적인 시술을 진행한 선도적인 라식 및 시력 교정 센터. 첨단 레이저 기술과 숙련된 의료진.',
'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=1200&h=800&fit=crop',
'567 Teheran-ro, Gangnam-gu', 'Seoul', 'Gangnam',
'+82-2-5678-9012', 'info@gangnam-eye.com', 'https://gangnam-eye.com',
ARRAY['Ophthalmology', 'LASIK', 'Cataract', 'Glaucoma'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean'],
ARRAY['JCI'],
TRUE, TRUE, 4.8, 1500, TRUE, TRUE, 'published'),

-- Hair Transplant
('hair-revival-clinic', 'Hair Revival Clinic', '헤어리바이벌클리닉', 'ヘアリバイバルクリニック', '毛发复活诊所', '毛髮復活診所', 'Hair Revival Clinic', 'Үс сэргээх эмнэлэг', 'Клиника Восстановления Волос',
'Specialized hair transplant center using FUE and DHI techniques. Natural-looking results with minimal downtime.',
'FUE와 DHI 기술을 사용하는 전문 모발 이식 센터. 최소 다운타임으로 자연스러운 결과.',
'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=800&fit=crop',
'890 Sinsa-dong, Gangnam-gu', 'Seoul', 'Sinsa',
'+82-2-6789-0123', 'contact@hairrevival.kr', 'https://hairrevival.kr',
ARRAY['Hair Transplant', 'Dermatology', 'PRP Therapy'],
ARRAY['English', 'Chinese', 'Arabic', 'Korean'],
ARRAY['KHA'],
TRUE, FALSE, 4.7, 680, FALSE, TRUE, 'published'),

-- Fertility Centers
('seoul-fertility-center', 'Seoul Fertility Center', '서울난임센터', 'ソウル不妊センター', '首尔生育中心', '首爾生育中心', 'Seoul Fertility Center', 'Сөүл үржил эмнэлэг', 'Сеульский Центр Фертильности',
'Premier fertility clinic offering IVF, egg freezing, and comprehensive reproductive health services with high success rates.',
'IVF, 난자 동결 및 종합 생식 건강 서비스를 높은 성공률로 제공하는 프리미어 난임 클리닉.',
'https://images.unsplash.com/photo-1584515933487-779824d29309?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1584515933487-779824d29309?w=1200&h=800&fit=crop',
'123 Jamsil-dong, Songpa-gu', 'Seoul', 'Jamsil',
'+82-2-7890-1234', 'info@seoulfertility.com', 'https://seoulfertility.com',
ARRAY['Fertility', 'IVF', 'Gynecology', 'Egg Freezing'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean', 'Vietnamese'],
ARRAY['JCI'],
TRUE, TRUE, 4.9, 450, TRUE, TRUE, 'published'),

-- Orthopedics
('korea-spine-center', 'Korea Spine & Joint Center', '한국척추관절센터', '韓国脊椎関節センター', '韩国脊椎关节中心', '韓國脊椎關節中心', 'Korea Spine & Joint Center', 'Солонгос нуруу үе мөчний төв', 'Корейский Центр Позвоночника',
'Specialized orthopedic center for spine and joint procedures using minimally invasive techniques and robotic surgery.',
'최소 침습 기술과 로봇 수술을 이용한 척추 및 관절 시술 전문 정형외과 센터.',
'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1200&h=800&fit=crop',
'456 Yeongdeungpo-ro, Yeongdeungpo-gu', 'Seoul', 'Yeongdeungpo',
'+82-2-8901-2345', 'contact@koreaspine.com', 'https://koreaspine.com',
ARRAY['Orthopedics', 'Spine Surgery', 'Joint Replacement', 'Sports Medicine'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean', 'Russian'],
ARRAY['JCI', 'KHA'],
TRUE, TRUE, 4.7, 520, FALSE, TRUE, 'published'),

-- Dermatology Specialty
('glow-skin-clinic', 'Glow Skin Clinic', '글로우피부과', 'グロースキンクリニック', '光彩皮肤诊所', '光彩皮膚診所', 'Glow Skin Clinic', 'Glow арьсны эмнэлэг', 'Клиника Сияющей Кожи',
'Premium dermatology clinic offering cutting-edge laser treatments, anti-aging procedures, and customized skincare solutions.',
'첨단 레이저 치료, 안티에이징 시술, 맞춤형 스킨케어 솔루션을 제공하는 프리미엄 피부과.',
'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=800&fit=crop',
'789 Cheongdam-dong, Gangnam-gu', 'Seoul', 'Cheongdam',
'+82-2-9012-3456', 'glow@glowskin.kr', 'https://glowskin.kr',
ARRAY['Dermatology', 'Laser Treatment', 'Anti-aging', 'Acne Treatment'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean'],
ARRAY['KFDA'],
TRUE, TRUE, 4.8, 760, TRUE, TRUE, 'published'),

-- Additional Hospitals
('wonjin-plastic-surgery', 'Wonjin Plastic Surgery', '원진성형외과', 'ウォンジン整形外科', '原辰整形外科', '原辰整形外科', 'Wonjin Plastic Surgery', 'Wonjin гоо сайхны мэс засал', 'Вонджин Пластическая Хирургия',
'One of Korea''s largest plastic surgery clinics with comprehensive services and international patient support.',
'한국 최대 규모의 성형외과 중 하나로 종합 서비스와 국제 환자 지원 제공.',
'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop',
'170 Apgujeong-ro, Gangnam-gu', 'Seoul', 'Apgujeong',
'+82-2-0123-4567', 'global@wonjin.com', 'https://wonjin.com',
ARRAY['Plastic Surgery', 'Facial Contouring', 'Body Contouring', 'Breast Surgery'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean', 'Vietnamese', 'Thai'],
ARRAY['JCI', 'KFDA'],
TRUE, TRUE, 4.7, 3200, TRUE, TRUE, 'published'),

('id-hospital', 'ID Hospital', 'ID병원', 'ID病院', 'ID医院', 'ID醫院', 'ID Hospital', 'ID эмнэлэг', 'Госпиталь ID',
'Renowned for facial contouring and comprehensive plastic surgery with dedicated international centers.',
'안면윤곽 및 종합 성형수술로 유명하며 전용 국제센터 운영.',
'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop',
'574 Gangnam-daero, Gangnam-gu', 'Seoul', 'Gangnam',
'+82-2-3496-9500', 'global@idhospital.com', 'https://idhospital.com',
ARRAY['Plastic Surgery', 'Facial Contouring', 'Eye Surgery', 'Nose Surgery'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean', 'Vietnamese', 'Thai', 'Russian'],
ARRAY['JCI', 'KHA'],
TRUE, TRUE, 4.8, 4500, TRUE, TRUE, 'published'),

('banobagi-plastic-surgery', 'Banobagi Plastic Surgery', '바노바기성형외과', 'バノバギ整形外科', '芭诺芭琦整形外科', '芭諾芭琦整形外科', 'Banobagi Plastic Surgery', 'Banobagi гоо сайхны мэс засал', 'Банобаги Пластическая Хирургия',
'Specializing in natural beauty enhancement with a focus on facial harmony and personalized consultations.',
'자연스러운 미용 향상 전문으로 얼굴 조화와 맞춤 상담에 중점.',
'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=800&fit=crop',
'627 Gangnam-daero, Gangnam-gu', 'Seoul', 'Gangnam',
'+82-2-522-6636', 'consult@banobagi.com', 'https://banobagi.com',
ARRAY['Plastic Surgery', 'Rhinoplasty', 'Eye Surgery', 'Anti-aging'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean'],
ARRAY['JCI'],
TRUE, TRUE, 4.8, 2800, TRUE, TRUE, 'published'),

('view-plastic-surgery', 'View Plastic Surgery', '뷰성형외과', 'ビュー整形外科', 'View整形外科', 'View整形外科', 'View Plastic Surgery', 'View гоо сайхны мэс засал', 'Вью Пластическая Хирургия',
'Premium plastic surgery clinic with focus on facial aesthetics and bone contouring procedures.',
'안면 미용과 뼈 윤곽 시술에 중점을 둔 프리미엄 성형외과.',
'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop',
'837 Nonhyeon-ro, Gangnam-gu', 'Seoul', 'Gangnam',
'+82-2-3448-0900', 'info@viewps.kr', 'https://viewps.kr',
ARRAY['Plastic Surgery', 'Facial Contouring', 'Rhinoplasty'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean'],
ARRAY['JCI'],
TRUE, TRUE, 4.7, 1950, FALSE, TRUE, 'published'),

('pretty-body-clinic', 'Pretty Body Clinic', '프리티바디클리닉', 'プリティボディクリニック', '美丽身材诊所', '美麗身材診所', 'Pretty Body Clinic', 'Pretty Body эмнэлэг', 'Клиника Красивого Тела',
'Body contouring specialists offering liposuction, breast surgery, and comprehensive body sculpting procedures.',
'지방흡입, 가슴 수술, 종합 바디 스컬프팅 시술을 제공하는 바디 윤곽 전문가.',
'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop',
'12 Apgujeong-ro 50-gil, Gangnam-gu', 'Seoul', 'Apgujeong',
'+82-2-544-7522', 'info@prettybody.kr', 'https://prettybody.kr',
ARRAY['Plastic Surgery', 'Liposuction', 'Breast Surgery', 'Body Contouring'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean'],
ARRAY['KHA'],
TRUE, TRUE, 4.6, 890, FALSE, TRUE, 'published'),

('cha-fertility-center', 'CHA Fertility Center', 'CHA 난임센터', 'CHA不妊センター', 'CHA生育中心', 'CHA生育中心', 'CHA Fertility Center', 'CHA үржил эмнэлэг', 'Центр Фертильности ЧА',
'World-class fertility center with advanced IVF technologies and personalized treatment protocols.',
'첨단 IVF 기술과 맞춤형 치료 프로토콜을 갖춘 세계적 수준의 난임 센터.',
'https://images.unsplash.com/photo-1584515933487-779824d29309?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1584515933487-779824d29309?w=1200&h=800&fit=crop',
'606 Gangnam-daero, Gangnam-gu', 'Seoul', 'Gangnam',
'+82-2-3468-3000', 'fertility@chamc.co.kr', 'https://chamc.co.kr',
ARRAY['Fertility', 'IVF', 'Egg Freezing', 'Reproductive Medicine'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean'],
ARRAY['JCI'],
TRUE, TRUE, 4.9, 1200, TRUE, TRUE, 'published'),

('yonsei-severance-hospital', 'Yonsei Severance Hospital', '연세 세브란스 병원', '延世セブランス病院', '延世塞布兰斯医院', '延世塞布蘭斯醫院', 'Yonsei Severance Hospital', 'Yonsei Severance эмнэлэг', 'Госпиталь Северанс Ёнсе',
'One of Korea''s top university hospitals offering comprehensive medical services and health checkup programs.',
'한국 최고의 대학 병원 중 하나로 종합 의료 서비스와 건강검진 프로그램 제공.',
'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=200&fit=crop',
'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=800&fit=crop',
'50-1 Yonsei-ro, Seodaemun-gu', 'Seoul', 'Seodaemun',
'+82-2-2228-5800', 'international@yuhs.ac', 'https://sev.severance.healthcare',
ARRAY['Health Checkup', 'Cancer Treatment', 'Cardiology', 'Neurology'],
ARRAY['English', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Arabic'],
ARRAY['JCI', 'KHA'],
TRUE, TRUE, 4.8, 5600, TRUE, TRUE, 'published')

ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_ko = EXCLUDED.name_ko,
    name_ja = EXCLUDED.name_ja,
    name_zh_cn = EXCLUDED.name_zh_cn,
    name_zh_tw = EXCLUDED.name_zh_tw,
    name_th = EXCLUDED.name_th,
    name_mn = EXCLUDED.name_mn,
    name_ru = EXCLUDED.name_ru,
    description_en = EXCLUDED.description_en,
    description_ko = EXCLUDED.description_ko,
    logo_url = EXCLUDED.logo_url,
    cover_image_url = EXCLUDED.cover_image_url,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    website = EXCLUDED.website,
    specialties = EXCLUDED.specialties,
    languages = EXCLUDED.languages,
    certifications = EXCLUDED.certifications,
    has_cctv = EXCLUDED.has_cctv,
    has_female_doctor = EXCLUDED.has_female_doctor,
    avg_rating = EXCLUDED.avg_rating,
    review_count = EXCLUDED.review_count,
    is_featured = EXCLUDED.is_featured,
    is_verified = EXCLUDED.is_verified,
    status = EXCLUDED.status;

-- ============================================
-- PART 7: Link Hospitals to Procedures
-- ============================================

-- Create hospital-procedure links (using UUIDs from inserted data)
DO $$
DECLARE
    v_grand_ps_id UUID;
    v_seoul_aesthetic_id UUID;
    v_seoul_wellness_id UUID;
    v_smile_dental_id UUID;
    v_gangnam_eye_id UUID;
    v_hair_revival_id UUID;
    v_seoul_fertility_id UUID;
    v_glow_skin_id UUID;
    v_wonjin_id UUID;
    v_id_hospital_id UUID;
    v_rhinoplasty_id UUID;
    v_double_eyelid_id UUID;
    v_facial_contouring_id UUID;
    v_fat_grafting_id UUID;
    v_skin_rejuv_id UUID;
    v_botox_id UUID;
    v_dental_implants_id UUID;
    v_lasik_id UUID;
    v_fue_hair_id UUID;
    v_health_checkup_id UUID;
    v_ivf_id UUID;
    v_thread_lift_id UUID;
BEGIN
    -- Get hospital IDs
    SELECT id INTO v_grand_ps_id FROM hospitals WHERE slug = 'grand-plastic-surgery';
    SELECT id INTO v_seoul_aesthetic_id FROM hospitals WHERE slug = 'seoul-aesthetic-clinic';
    SELECT id INTO v_seoul_wellness_id FROM hospitals WHERE slug = 'seoul-wellness-center';
    SELECT id INTO v_smile_dental_id FROM hospitals WHERE slug = 'smile-dental-korea';
    SELECT id INTO v_gangnam_eye_id FROM hospitals WHERE slug = 'gangnam-eye-center';
    SELECT id INTO v_hair_revival_id FROM hospitals WHERE slug = 'hair-revival-clinic';
    SELECT id INTO v_seoul_fertility_id FROM hospitals WHERE slug = 'seoul-fertility-center';
    SELECT id INTO v_glow_skin_id FROM hospitals WHERE slug = 'glow-skin-clinic';
    SELECT id INTO v_wonjin_id FROM hospitals WHERE slug = 'wonjin-plastic-surgery';
    SELECT id INTO v_id_hospital_id FROM hospitals WHERE slug = 'id-hospital';

    -- Get procedure IDs
    SELECT id INTO v_rhinoplasty_id FROM procedures WHERE slug = 'rhinoplasty';
    SELECT id INTO v_double_eyelid_id FROM procedures WHERE slug = 'double-eyelid-surgery';
    SELECT id INTO v_facial_contouring_id FROM procedures WHERE slug = 'facial-contouring';
    SELECT id INTO v_fat_grafting_id FROM procedures WHERE slug = 'fat-grafting';
    SELECT id INTO v_skin_rejuv_id FROM procedures WHERE slug = 'skin-rejuvenation';
    SELECT id INTO v_botox_id FROM procedures WHERE slug = 'botox-fillers';
    SELECT id INTO v_dental_implants_id FROM procedures WHERE slug = 'dental-implants';
    SELECT id INTO v_lasik_id FROM procedures WHERE slug = 'lasik-surgery';
    SELECT id INTO v_fue_hair_id FROM procedures WHERE slug = 'fue-hair-transplant';
    SELECT id INTO v_health_checkup_id FROM procedures WHERE slug = 'comprehensive-health-checkup';
    SELECT id INTO v_ivf_id FROM procedures WHERE slug = 'ivf-treatment';
    SELECT id INTO v_thread_lift_id FROM procedures WHERE slug = 'thread-lift';

    -- Link Grand Plastic Surgery
    IF v_grand_ps_id IS NOT NULL AND v_rhinoplasty_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_grand_ps_id, v_rhinoplasty_id, '$3,000 - $8,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    IF v_grand_ps_id IS NOT NULL AND v_facial_contouring_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_grand_ps_id, v_facial_contouring_id, '$8,000 - $15,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    IF v_grand_ps_id IS NOT NULL AND v_double_eyelid_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_grand_ps_id, v_double_eyelid_id, '$1,500 - $3,500', FALSE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    -- Link Seoul Aesthetic Clinic
    IF v_seoul_aesthetic_id IS NOT NULL AND v_double_eyelid_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_seoul_aesthetic_id, v_double_eyelid_id, '$1,800 - $4,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    IF v_seoul_aesthetic_id IS NOT NULL AND v_botox_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_seoul_aesthetic_id, v_botox_id, '$300 - $1,200', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    -- Link Glow Skin Clinic
    IF v_glow_skin_id IS NOT NULL AND v_skin_rejuv_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_glow_skin_id, v_skin_rejuv_id, '$300 - $2,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    IF v_glow_skin_id IS NOT NULL AND v_thread_lift_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_glow_skin_id, v_thread_lift_id, '$1,500 - $4,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    -- Link Seoul Wellness Center
    IF v_seoul_wellness_id IS NOT NULL AND v_health_checkup_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_seoul_wellness_id, v_health_checkup_id, '$800 - $3,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    -- Link Smile Dental
    IF v_smile_dental_id IS NOT NULL AND v_dental_implants_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_smile_dental_id, v_dental_implants_id, '$1,200 - $2,500', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    -- Link Gangnam Eye Center
    IF v_gangnam_eye_id IS NOT NULL AND v_lasik_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_gangnam_eye_id, v_lasik_id, '$1,800 - $3,500', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    -- Link Hair Revival
    IF v_hair_revival_id IS NOT NULL AND v_fue_hair_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_hair_revival_id, v_fue_hair_id, '$5,000 - $12,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    -- Link Seoul Fertility
    IF v_seoul_fertility_id IS NOT NULL AND v_ivf_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_seoul_fertility_id, v_ivf_id, '$6,000 - $15,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    -- Link Wonjin Plastic Surgery (multi-procedure)
    IF v_wonjin_id IS NOT NULL AND v_rhinoplasty_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_wonjin_id, v_rhinoplasty_id, '$2,500 - $7,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    IF v_wonjin_id IS NOT NULL AND v_facial_contouring_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_wonjin_id, v_facial_contouring_id, '$7,000 - $14,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    IF v_wonjin_id IS NOT NULL AND v_double_eyelid_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_wonjin_id, v_double_eyelid_id, '$1,500 - $3,800', FALSE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    -- Link ID Hospital (multi-procedure)
    IF v_id_hospital_id IS NOT NULL AND v_facial_contouring_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_id_hospital_id, v_facial_contouring_id, '$8,000 - $18,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    IF v_id_hospital_id IS NOT NULL AND v_rhinoplasty_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_id_hospital_id, v_rhinoplasty_id, '$3,500 - $9,000', TRUE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

    IF v_id_hospital_id IS NOT NULL AND v_double_eyelid_id IS NOT NULL THEN
        INSERT INTO hospital_procedures (hospital_id, procedure_id, price_range, is_featured)
        VALUES (v_id_hospital_id, v_double_eyelid_id, '$2,000 - $4,500', FALSE)
        ON CONFLICT (hospital_id, procedure_id) DO UPDATE SET price_range = EXCLUDED.price_range, is_featured = EXCLUDED.is_featured;
    END IF;

END $$;

-- ============================================
-- PART 8: Grant Permissions
-- ============================================

GRANT SELECT ON hospital_procedures TO anon;
GRANT SELECT ON hospital_procedures TO authenticated;
GRANT ALL ON hospital_procedures TO service_role;

-- ============================================
-- PART 9: Enable RLS for hospital_procedures
-- ============================================

ALTER TABLE hospital_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hospital_procedures_read_policy" ON hospital_procedures
    FOR SELECT USING (true);

CREATE POLICY "hospital_procedures_write_policy" ON hospital_procedures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'hospital_admin')
        )
    );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
