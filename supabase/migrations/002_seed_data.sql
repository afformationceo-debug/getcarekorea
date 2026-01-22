-- GetCareKorea Seed Data
-- Sample data for development and testing

-- ============================================
-- SAMPLE HOSPITALS
-- ============================================

INSERT INTO hospitals (
    slug, name_en, name_zh_tw, name_ja,
    description_en, description_zh_tw, description_ja,
    logo_url, cover_image_url, gallery,
    address, city, latitude, longitude,
    phone, email, website,
    specialties, languages, certifications,
    has_cctv, has_female_doctor, operating_hours,
    avg_rating, review_count, is_featured, is_verified, status
) VALUES
(
    'id-hospital-gangnam',
    'ID Hospital',
    'ID整形外科',
    'ID美容外科',
    'ID Hospital is a leading plastic surgery hospital in Seoul, Korea, specializing in facial contouring, rhinoplasty, and comprehensive aesthetic procedures.',
    'ID整形外科是韓國首爾領先的整形外科醫院，專門從事面部輪廓、鼻整形和綜合美容手術。',
    'ID美容外科は、韓国ソウルにある顔面輪郭形成術、鼻形成術、総合美容手術を専門とする一流の美容整形病院です。',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200',
    ARRAY['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800'],
    '137 Cheongdam-dong, Gangnam-gu',
    'Seoul',
    37.5227,
    127.0385,
    '+82-2-3496-9500',
    'info@idhospital.com',
    'https://www.idhospital.com',
    ARRAY['Facial Contouring', 'Rhinoplasty', 'Eye Surgery', 'Breast Surgery', 'Body Contouring'],
    ARRAY['Korean', 'English', 'Chinese', 'Japanese', 'Thai', 'Vietnamese', 'Russian'],
    ARRAY['JCI Accredited', 'KFDA Approved', 'Member of ISAPS'],
    true, true,
    '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-14:00", "sunday": "closed"}'::jsonb,
    4.85, 2341, true, true, 'published'
),
(
    'view-plastic-surgery',
    'VIEW Plastic Surgery',
    'VIEW整形外科',
    'VIEW美容外科クリニック',
    'VIEW Plastic Surgery is renowned for its natural-looking results in facial aesthetic procedures, with over 20 years of experience.',
    'VIEW整形外科以其面部美容手術的自然效果聞名，擁有超過20年的經驗。',
    'VIEW美容外科は、20年以上の経験を持つ顔面美容手術の自然な仕上がりで有名です。',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200',
    ARRAY['https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800'],
    '841 Nonhyeon-ro, Gangnam-gu',
    'Seoul',
    37.5040,
    127.0245,
    '+82-2-540-8181',
    'global@viewps.com',
    'https://www.viewplasticsurgery.com',
    ARRAY['Eye Surgery', 'Rhinoplasty', 'Facelift', 'Anti-aging', 'Fat Grafting'],
    ARRAY['Korean', 'English', 'Chinese', 'Japanese'],
    ARRAY['JCI Accredited', 'ISAPS Member'],
    true, true,
    '{"monday": "10:00-19:00", "tuesday": "10:00-19:00", "wednesday": "10:00-19:00", "thursday": "10:00-19:00", "friday": "10:00-19:00", "saturday": "10:00-17:00", "sunday": "closed"}'::jsonb,
    4.78, 1893, true, true, 'published'
),
(
    'grand-plastic-surgery',
    'Grand Plastic Surgery',
    'Grand整形外科',
    'グランド美容外科',
    'Grand Plastic Surgery offers world-class breast and body contouring procedures with cutting-edge technology and personalized care.',
    'Grand整形外科提供世界一流的胸部和身體輪廓手術，配備尖端技術和個性化護理。',
    'グランド美容外科は、最先端の技術と個別のケアで、世界クラスの豊胸と身体輪郭形成手術を提供しています。',
    'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=200',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200',
    ARRAY['https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800'],
    '456 Apgujeong-ro, Gangnam-gu',
    'Seoul',
    37.5271,
    127.0390,
    '+82-2-538-3000',
    'international@grandps.com',
    'https://www.grandplasticsurgery.com',
    ARRAY['Breast Surgery', 'Liposuction', 'Tummy Tuck', 'Body Contouring', 'Brazilian Butt Lift'],
    ARRAY['Korean', 'English', 'Chinese', 'Russian', 'Arabic'],
    ARRAY['JCI Accredited', 'ISO Certified'],
    true, true,
    '{"monday": "09:30-18:30", "tuesday": "09:30-18:30", "wednesday": "09:30-18:30", "thursday": "09:30-18:30", "friday": "09:30-18:30", "saturday": "09:30-15:00", "sunday": "closed"}'::jsonb,
    4.72, 1567, true, true, 'published'
),
(
    'april31-plastic-surgery',
    'April31 Plastic Surgery',
    'April31整形外科',
    'エイプリル31美容外科',
    'April31 specializes in facial bone surgery and rhinoplasty, known for harmonious and natural results.',
    'April31專門從事面部骨骼手術和鼻整形，以和諧自然的效果著稱。',
    'エイプリル31は、調和のとれた自然な仕上がりで知られる顔面骨手術と鼻形成術を専門としています。',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200',
    ARRAY['https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800'],
    '553 Gangnam-daero, Seocho-gu',
    'Seoul',
    37.5012,
    127.0263,
    '+82-2-511-4311',
    'global@april31.com',
    'https://www.april31.com',
    ARRAY['Facial Contouring', 'Rhinoplasty', 'Jaw Surgery', 'Cheekbone Reduction', 'Chin Surgery'],
    ARRAY['Korean', 'English', 'Japanese', 'Thai', 'Mongolian'],
    ARRAY['JCI Accredited', 'KFDA Approved'],
    true, false,
    '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-13:00", "sunday": "closed"}'::jsonb,
    4.69, 1234, false, true, 'published'
),
(
    'banobagi-plastic-surgery',
    'Banobagi Plastic Surgery',
    'Banobagi整形外科',
    'バノバギ美容外科',
    'Banobagi is Korea largest plastic surgery hospital with over 50 board-certified surgeons and comprehensive facilities.',
    'Banobagi是韓國最大的整形外科醫院，擁有50多名認證外科醫生和綜合設施。',
    'バノバギは、50名以上の認定外科医と包括的な施設を持つ韓国最大の美容整形病院です。',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200',
    'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200',
    ARRAY['https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800', 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800'],
    '605 Gangnam-daero, Seocho-gu',
    'Seoul',
    37.5054,
    127.0260,
    '+82-2-522-6636',
    'global@banobagi.com',
    'https://www.banobagi.com',
    ARRAY['All Plastic Surgery', 'Rhinoplasty', 'Breast Surgery', 'Anti-aging', 'Eye Surgery', 'Facial Contouring'],
    ARRAY['Korean', 'English', 'Chinese', 'Japanese', 'Vietnamese', 'Thai', 'Russian', 'Arabic'],
    ARRAY['JCI Accredited', 'KFDA Approved', 'ISO 9001'],
    true, true,
    '{"monday": "09:00-19:00", "tuesday": "09:00-19:00", "wednesday": "09:00-19:00", "thursday": "09:00-19:00", "friday": "09:00-19:00", "saturday": "09:00-16:00", "sunday": "closed"}'::jsonb,
    4.81, 3456, true, true, 'published'
);

-- ============================================
-- SAMPLE DOCTORS
-- ============================================

INSERT INTO doctors (
    hospital_id, name_en, name_zh_tw, name_ja,
    title_en, title_zh_tw, title_ja,
    bio_en,
    photo_url, specialties, languages,
    years_experience, education, certifications, is_available
)
SELECT
    h.id,
    'Dr. Kim Min-Jun',
    '金民俊醫師',
    '金民俊医師',
    'Chief Surgeon, Rhinoplasty Specialist',
    '首席外科醫師，鼻整形專家',
    '院長、鼻形成術専門医',
    'Dr. Kim Min-Jun is a board-certified plastic surgeon with over 15 years of experience in rhinoplasty. He has performed over 10,000 successful procedures.',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
    ARRAY['Rhinoplasty', 'Revision Rhinoplasty', 'Tip Plasty'],
    ARRAY['Korean', 'English'],
    15,
    '[{"degree": "MD", "school": "Seoul National University", "year": 2005}, {"degree": "Residency", "school": "Asan Medical Center", "year": 2010}]'::jsonb,
    ARRAY['Korean Board of Plastic Surgery', 'ISAPS Member'],
    true
FROM hospitals h WHERE h.slug = 'id-hospital-gangnam';

INSERT INTO doctors (
    hospital_id, name_en, name_zh_tw, name_ja,
    title_en, title_zh_tw, title_ja,
    bio_en,
    photo_url, specialties, languages,
    years_experience, education, certifications, is_available
)
SELECT
    h.id,
    'Dr. Park Ji-Yeon',
    '朴智妍醫師',
    '朴智妍医師',
    'Director, Eye Surgery Center',
    '眼部手術中心主任',
    'アイセンター部長',
    'Dr. Park is a renowned eye surgery specialist known for creating natural-looking double eyelids. She has extensive experience with Asian eyelid surgery.',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    ARRAY['Double Eyelid Surgery', 'Ptosis Correction', 'Under Eye Fat Repositioning', 'Canthoplasty'],
    ARRAY['Korean', 'English', 'Japanese'],
    12,
    '[{"degree": "MD", "school": "Yonsei University", "year": 2008}, {"degree": "Fellowship", "school": "Samsung Medical Center", "year": 2012}]'::jsonb,
    ARRAY['Korean Board of Plastic Surgery', 'ASOPRS Member'],
    true
FROM hospitals h WHERE h.slug = 'view-plastic-surgery';

INSERT INTO doctors (
    hospital_id, name_en, name_zh_tw, name_ja,
    title_en, title_zh_tw, title_ja,
    bio_en,
    photo_url, specialties, languages,
    years_experience, education, certifications, is_available
)
SELECT
    h.id,
    'Dr. Lee Sung-Ho',
    '李成浩醫師',
    '李成浩医師',
    'Breast Surgery Specialist',
    '胸部手術專家',
    '豊胸手術専門医',
    'Dr. Lee specializes in breast augmentation using the latest techniques including motiva implants and fat grafting.',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
    ARRAY['Breast Augmentation', 'Breast Lift', 'Breast Reduction', 'Fat Grafting'],
    ARRAY['Korean', 'English', 'Chinese'],
    18,
    '[{"degree": "MD PhD", "school": "Korea University", "year": 2002}]'::jsonb,
    ARRAY['Korean Board of Plastic Surgery', 'ISAPS Member', 'KSAPS Member'],
    true
FROM hospitals h WHERE h.slug = 'grand-plastic-surgery';

-- ============================================
-- SAMPLE PROCEDURES
-- ============================================

INSERT INTO procedures (
    hospital_id, slug, category,
    name_en, name_zh_tw, name_ja,
    description_en, description_zh_tw, description_ja,
    price_min, price_max, price_currency,
    duration_minutes, recovery_days,
    includes, requirements, is_popular
)
SELECT
    h.id,
    'rhinoplasty-implant',
    'Rhinoplasty',
    'Rhinoplasty with Implant',
    '鼻整形（假體）',
    '鼻形成術（インプラント）',
    'Nose bridge augmentation using silicone or Gore-Tex implant for enhanced height and definition.',
    '使用矽膠或Gore-Tex假體進行鼻樑增高，提升高度和輪廓定義。',
    'シリコンまたはゴアテックスインプラントを使用した鼻筋の隆鼻術。',
    3500, 5500, 'USD',
    90, 14,
    ARRAY['Pre-operative consultation', 'CT scan', 'Anesthesia', 'Implant', 'Medication', '1 follow-up visit'],
    ARRAY['No blood thinners 2 weeks before', 'No smoking 2 weeks before', 'Fasting 8 hours before'],
    true
FROM hospitals h WHERE h.slug = 'id-hospital-gangnam';

INSERT INTO procedures (
    hospital_id, slug, category,
    name_en, name_zh_tw, name_ja,
    description_en,
    price_min, price_max, price_currency,
    duration_minutes, recovery_days,
    includes, requirements, is_popular
)
SELECT
    h.id,
    'double-eyelid-incisional',
    'Eye Surgery',
    'Incisional Double Eyelid Surgery',
    '切開式雙眼皮手術',
    '切開法二重術',
    'Permanent double eyelid crease creation through incision technique, ideal for those with thick eyelid skin or excess fat.',
    2000, 3500, 'USD',
    60, 10,
    ARRAY['Consultation', 'Local anesthesia', 'Medication', 'Stitch removal', '2 follow-up visits'],
    ARRAY['No contact lenses 1 week before', 'No eye makeup day of surgery'],
    true
FROM hospitals h WHERE h.slug = 'view-plastic-surgery';

INSERT INTO procedures (
    hospital_id, slug, category,
    name_en, name_zh_tw, name_ja,
    description_en,
    price_min, price_max, price_currency,
    duration_minutes, recovery_days,
    includes, requirements, is_popular
)
SELECT
    h.id,
    'breast-augmentation-motiva',
    'Breast Surgery',
    'Breast Augmentation (Motiva)',
    '隆胸手術（Motiva）',
    '豊胸手術（Motiva）',
    'Breast augmentation using Motiva Ergonomix implants for natural look and feel with minimal scarring.',
    6500, 9000, 'USD',
    120, 21,
    ARRAY['3D simulation', 'Implants', 'General anesthesia', 'Compression garment', 'Medications', '3 follow-up visits'],
    ARRAY['Mammogram within 6 months', 'No blood thinners', 'Arrange 1 week off work'],
    true
FROM hospitals h WHERE h.slug = 'grand-plastic-surgery';

INSERT INTO procedures (
    hospital_id, slug, category,
    name_en, name_zh_tw, name_ja,
    description_en,
    price_min, price_max, price_currency,
    duration_minutes, recovery_days,
    includes, requirements, is_popular
)
SELECT
    h.id,
    'facial-contouring-v-line',
    'Facial Contouring',
    'V-Line Surgery (Square Jaw Reduction + Chin)',
    'V型線手術（方形下頜縮小+下巴）',
    'Vライン手術（エラ削り+顎形成）',
    'Comprehensive V-line surgery including square jaw reduction and chin advancement for a slim, feminine jawline.',
    8000, 12000, 'USD',
    180, 28,
    ARRAY['CT scan', '3D modeling', 'General anesthesia', 'Hospital stay (1 night)', 'Face compression band', 'Medications'],
    ARRAY['Dental X-ray', 'Blood test', 'No smoking 4 weeks', 'Arrange 2 weeks off'],
    true
FROM hospitals h WHERE h.slug = 'april31-plastic-surgery';

-- ============================================
-- SAMPLE BLOG POSTS
-- ============================================

INSERT INTO blog_posts (
    slug,
    title_en, title_zh_tw, title_ja,
    excerpt_en, excerpt_zh_tw, excerpt_ja,
    content_en,
    cover_image_url, category, tags,
    status, published_at, view_count
) VALUES
(
    'korean-rhinoplasty-guide-2024',
    'The Complete Guide to Korean Rhinoplasty in 2024',
    '2024年韓國鼻整形完整指南',
    '2024年韓国での鼻形成術完全ガイド',
    'Everything you need to know about getting a nose job in Korea, from choosing the right surgeon to recovery tips.',
    '關於在韓國進行鼻整形手術的一切，從選擇合適的外科醫生到恢復技巧。',
    '韓国で鼻形成術を受けるために知っておくべきすべてのこと。',
    '<h2>Why Choose Korea for Rhinoplasty?</h2><p>Korea is often called the "plastic surgery capital of the world," and for good reason...</p><h2>Types of Rhinoplasty in Korea</h2><p>Korean clinics offer various rhinoplasty procedures...</p>',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200',
    'Plastic Surgery',
    ARRAY['rhinoplasty', 'korea', 'plastic surgery', 'nose job', 'medical tourism'],
    'published', NOW() - INTERVAL '7 days', 15420
),
(
    'double-eyelid-surgery-korea-before-after',
    'Korean Double Eyelid Surgery: Before & After Guide',
    '韓國雙眼皮手術：術前術後指南',
    '韓国での二重まぶた手術：ビフォー・アフターガイド',
    'A comprehensive guide to double eyelid surgery in Korea with real before and after results.',
    '韓國雙眼皮手術綜合指南，附有真實術前術後效果。',
    '韓国での二重まぶた手術の包括的なガイド。',
    '<h2>Understanding Asian Eyelid Surgery</h2><p>Double eyelid surgery is one of the most popular procedures in Korea...</p>',
    'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=1200',
    'Eye Surgery',
    ARRAY['double eyelid', 'blepharoplasty', 'korea', 'eye surgery', 'asian eyelid'],
    'published', NOW() - INTERVAL '14 days', 12350
),
(
    'best-plastic-surgery-clinics-seoul-2024',
    'Top 10 Plastic Surgery Clinics in Seoul 2024',
    '2024年首爾十大整形外科診所',
    '2024年ソウルのトップ10美容整形クリニック',
    'Our curated list of the best plastic surgery clinics in Seoul based on expertise, reviews, and results.',
    '根據專業知識、評論和結果，我們精心挑選的首爾最佳整形外科診所名單。',
    '専門知識、レビュー、結果に基づいたソウルのベスト美容整形クリニック。',
    '<h2>How We Selected the Best Clinics</h2><p>Our team evaluated over 100 clinics in Seoul...</p>',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200',
    'Hospital Guides',
    ARRAY['best clinics', 'seoul', 'plastic surgery', 'hospital guide', 'korea'],
    'published', NOW() - INTERVAL '21 days', 28930
);

-- ============================================
-- SAMPLE CONTENT KEYWORDS
-- ============================================

INSERT INTO content_keywords (keyword, category, locale, search_volume, competition, priority, status)
VALUES
('korean rhinoplasty cost', 'Rhinoplasty', 'en', 8100, 0.65, 10, 'published'),
('double eyelid surgery korea', 'Eye Surgery', 'en', 6600, 0.58, 9, 'published'),
('best plastic surgery clinic seoul', 'General', 'en', 5400, 0.72, 8, 'published'),
('v line surgery korea', 'Facial Contouring', 'en', 4400, 0.61, 8, 'pending'),
('breast augmentation korea price', 'Breast Surgery', 'en', 3600, 0.55, 7, 'pending'),
('liposuction korea', 'Body Contouring', 'en', 2900, 0.48, 6, 'pending'),
('facelift surgery korea cost', 'Anti-aging', 'en', 2200, 0.52, 6, 'pending'),
('韓國整形手術', 'General', 'zh-TW', 12000, 0.45, 10, 'pending'),
('韓国美容整形', 'General', 'ja', 9800, 0.42, 10, 'pending'),
('เสริมจมูกเกาหลี', 'Rhinoplasty', 'th', 7500, 0.38, 9, 'pending');

-- Add indexes for better seed data query performance
ANALYZE hospitals;
ANALYZE doctors;
ANALYZE procedures;
ANALYZE blog_posts;
ANALYZE content_keywords;
