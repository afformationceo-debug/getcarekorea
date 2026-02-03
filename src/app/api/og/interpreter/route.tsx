import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// Use Edge runtime for fast response
export const runtime = 'edge';

// Supabase config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Localized content
const localeContent: Record<string, { title: string; subtitle: string }> = {
  en: { title: 'Medical Interpreter', subtitle: 'Professional Healthcare Interpretation in Korea' },
  ko: { title: '의료 통역사', subtitle: '한국 전문 의료 통역 서비스' },
  ja: { title: '医療通訳', subtitle: '韓国の専門医療通訳サービス' },
  'zh-CN': { title: '医疗翻译', subtitle: '韩国专业医疗翻译服务' },
  'zh-TW': { title: '醫療口譯', subtitle: '韓國專業醫療口譯服務' },
  th: { title: 'ล่ามแพทย์', subtitle: 'บริการล่ามการแพทย์มืออาชีพในเกาหลี' },
  mn: { title: 'Эмнэлгийн орчуулагч', subtitle: 'Солонгосын мэргэжлийн эмнэлгийн орчуулга' },
  ru: { title: 'Медицинский переводчик', subtitle: 'Профессиональный медицинский перевод в Корее' },
};

const specialtyNames: Record<string, string> = {
  'plastic-surgery': 'Plastic Surgery',
  'dermatology': 'Dermatology',
  'dental': 'Dental',
  'health-checkup': 'Health Checkup',
  'fertility': 'Fertility',
  'hair-transplant': 'Hair Transplant',
  'ophthalmology': 'Ophthalmology',
  'orthopedics': 'Orthopedics',
  'general-medical': 'General Medical',
};

const languageFlags: Record<string, string> = {
  en: '🇺🇸', ko: '🇰🇷', ja: '🇯🇵', 'zh-CN': '🇨🇳', 'zh-TW': '🇹🇼',
  th: '🇹🇭', mn: '🇲🇳', ru: '🇷🇺', vi: '🇻🇳', zh: '🇨🇳',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const locale = searchParams.get('locale') || 'en';

    if (!id) {
      return new Response('Missing interpreter ID', { status: 400 });
    }

    // Fetch interpreter data via Supabase REST API (fast in Edge)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const filterColumn = isUUID ? 'id' : 'slug';

    const apiUrl = `${SUPABASE_URL}/rest/v1/author_personas?select=name,primary_specialty,languages,photo_url&${filterColumn}=eq.${encodeURIComponent(id)}&is_active=eq.true&limit=1`;

    const response = await fetch(apiUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    const data = await response.json();
    const interpreter = data?.[0];

    if (!interpreter) {
      return new Response('Interpreter not found', { status: 404 });
    }

    // Extract data
    const nameData = interpreter.name as Record<string, string>;
    const name = nameData?.[locale] || nameData?.['en'] || 'Medical Interpreter';
    const photoUrl = interpreter.photo_url as string | null;
    const primarySpecialty = interpreter.primary_specialty as string | null;
    const specialty = specialtyNames[primarySpecialty || 'general-medical'] || 'Medical';
    const content = localeContent[locale] || localeContent.en;

    const interpreterLanguages = interpreter.languages as Array<{ code: string }> | null;
    const languages = Array.isArray(interpreterLanguages)
      ? interpreterLanguages.slice(0, 4).map((l) => languageFlags[l.code] || '🌐')
      : [];

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)',
          }}
        >
          {/* Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '48px 64px',
              backgroundColor: 'white',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                display: 'flex',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                border: '4px solid #8b5cf6',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    fontSize: '72px',
                    fontWeight: 700,
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name */}
            <div
              style={{
                fontSize: '42px',
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: '8px',
              }}
            >
              {name}
            </div>

            {/* Role */}
            <div
              style={{
                display: 'flex',
                fontSize: '22px',
                color: '#7c3aed',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              {content.title} • {specialty}
            </div>

            {/* Languages */}
            {languages.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '32px',
                  marginBottom: '16px',
                }}
              >
                {languages.map((flag: string, i: number) => (
                  <span key={i}>{flag}</span>
                ))}
              </div>
            )}

            {/* Subtitle */}
            <div
              style={{
                fontSize: '16px',
                color: '#6b7280',
              }}
            >
              {content.subtitle}
            </div>
          </div>

          {/* Branding */}
          <div
            style={{
              display: 'flex',
              marginTop: '24px',
              fontSize: '22px',
              fontWeight: 700,
              color: '#7c3aed',
            }}
          >
            GetCareKorea
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
