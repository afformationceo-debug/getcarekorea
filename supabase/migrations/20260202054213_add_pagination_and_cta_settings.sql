-- Add pagination and CTA settings to system_settings

-- Pagination settings
INSERT INTO system_settings (key, value, description, category) VALUES
(
    'pagination',
    '{
        "interpreters_per_page": 16,
        "hospitals_per_page": 12,
        "blog_posts_per_page": 10,
        "procedures_per_page": 12
    }',
    'Pagination size settings for various list pages',
    'ui'
)
ON CONFLICT (key) DO NOTHING;

-- CTA links settings per locale
INSERT INTO system_settings (key, value, description, category) VALUES
(
    'cta_links',
    '{
        "en": {
            "type": "whatsapp",
            "phone": "821086081915",
            "url": "https://wa.me/821086081915",
            "text": "Chat on WhatsApp",
            "color": "from-green-500 to-green-600"
        },
        "ko": {
            "type": "whatsapp",
            "phone": "821086081915",
            "url": "https://wa.me/821086081915",
            "text": "WhatsApp 상담",
            "color": "from-green-500 to-green-600"
        },
        "ja": {
            "type": "whatsapp",
            "phone": "821086081915",
            "url": "https://wa.me/821086081915",
            "text": "WhatsAppで相談",
            "color": "from-green-500 to-green-600"
        },
        "zh-TW": {
            "type": "whatsapp",
            "phone": "821086081915",
            "url": "https://wa.me/821086081915",
            "text": "WhatsApp諮詢",
            "color": "from-green-500 to-green-600"
        },
        "zh-CN": {
            "type": "whatsapp",
            "phone": "821086081915",
            "url": "https://wa.me/821086081915",
            "text": "WhatsApp咨询",
            "color": "from-green-500 to-green-600"
        },
        "th": {
            "type": "whatsapp",
            "phone": "821086081915",
            "url": "https://wa.me/821086081915",
            "text": "แชทผ่าน WhatsApp",
            "color": "from-green-500 to-green-600"
        },
        "mn": {
            "type": "whatsapp",
            "phone": "821086081915",
            "url": "https://wa.me/821086081915",
            "text": "WhatsApp-аар холбогдох",
            "color": "from-green-500 to-green-600"
        },
        "ru": {
            "type": "whatsapp",
            "phone": "821086081915",
            "url": "https://wa.me/821086081915",
            "text": "Чат в WhatsApp",
            "color": "from-green-500 to-green-600"
        }
    }',
    'CTA messenger links per locale (type: whatsapp/line/kakao/telegram)',
    'marketing'
)
ON CONFLICT (key) DO NOTHING;
