'use client';

import { useState, useEffect } from 'react';
import { Globe, Search, Share2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'mn', name: 'Монгол', flag: '🇲🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

interface SEOData {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
}

interface SEOPreviewProps {
  type: 'interpreter' | 'blog';
  data: {
    // For interpreter
    name?: Record<string, string>;
    bio_short?: Record<string, string>;
    photo_url?: string;
    slug?: string;
    primary_specialty?: string;
    languages?: Array<{ code: string; proficiency?: string }>;
    // For blog
    title?: string | Record<string, string>;
    excerpt?: string | Record<string, string>;
    cover_image_url?: string;
    locale?: string;
    category?: string;
  };
  defaultLocale?: string;
}

// SEO Templates for interpreters (synced with page.tsx - specialty removed from title)
const interpreterSeoTemplates: Record<string, {
  title: (name: string) => string;
  description: (name: string, specialty: string, languages: string) => string;
  specialties: Record<string, string>;
}> = {
  en: {
    title: (name) => `${name} | Medical Interpreter | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - Professional medical interpreter in Korea specializing in ${specialty}. Fluent in ${languages}. Book your interpreter for a seamless medical tourism experience.`,
    specialties: {
      'plastic-surgery': 'Plastic Surgery',
      'dermatology': 'Dermatology',
      'dental': 'Dental',
      'health-checkup': 'Health Checkup',
      'fertility': 'Fertility',
      'hair-transplant': 'Hair Transplant',
      'ophthalmology': 'Ophthalmology',
      'orthopedics': 'Orthopedics',
      'general-medical': 'General Medical',
    },
  },
  ko: {
    title: (name) => `${name} | 의료 통역사 | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - ${specialty} 전문 한국 의료 통역사. ${languages} 구사. 외국인 환자를 위한 전문 의료 통역 서비스를 제공합니다.`,
    specialties: {
      'plastic-surgery': '성형외과',
      'dermatology': '피부과',
      'dental': '치과',
      'health-checkup': '건강검진',
      'fertility': '난임',
      'hair-transplant': '모발이식',
      'ophthalmology': '안과',
      'orthopedics': '정형외과',
      'general-medical': '일반의료',
    },
  },
  ja: {
    title: (name) => `${name} | 医療通訳 | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - 韓国の${specialty}専門医療通訳者。${languages}対応。韓国での医療ツーリズムをサポートします。`,
    specialties: {
      'plastic-surgery': '美容整形',
      'dermatology': '皮膚科',
      'dental': '歯科',
      'health-checkup': '健康診断',
      'fertility': '不妊治療',
      'hair-transplant': '植毛',
      'ophthalmology': '眼科',
      'orthopedics': '整形外科',
      'general-medical': '一般医療',
    },
  },
  'zh-CN': {
    title: (name) => `${name} | 医疗翻译 | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - 韩国${specialty}专业医疗翻译。精通${languages}。为您的韩国医疗之旅提供专业翻译服务。`,
    specialties: {
      'plastic-surgery': '整形外科',
      'dermatology': '皮肤科',
      'dental': '牙科',
      'health-checkup': '健康体检',
      'fertility': '不孕治疗',
      'hair-transplant': '植发',
      'ophthalmology': '眼科',
      'orthopedics': '骨科',
      'general-medical': '综合医疗',
    },
  },
  'zh-TW': {
    title: (name) => `${name} | 醫療口譯 | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - 韓國${specialty}專業醫療口譯員。精通${languages}。為您的韓國醫療之旅提供專業口譯服務。`,
    specialties: {
      'plastic-surgery': '整形外科',
      'dermatology': '皮膚科',
      'dental': '牙科',
      'health-checkup': '健康檢查',
      'fertility': '不孕治療',
      'hair-transplant': '植髮',
      'ophthalmology': '眼科',
      'orthopedics': '骨科',
      'general-medical': '綜合醫療',
    },
  },
  th: {
    title: (name) => `${name} | ล่ามแพทย์ | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - ล่ามแพทย์เฉพาะทาง${specialty}ในเกาหลี พูดได้${languages} บริการล่ามสำหรับการท่องเที่ยวเชิงการแพทย์`,
    specialties: {
      'plastic-surgery': 'ศัลยกรรมตกแต่ง',
      'dermatology': 'ผิวหนัง',
      'dental': 'ทันตกรรม',
      'health-checkup': 'ตรวจสุขภาพ',
      'fertility': 'รักษาภาวะมีบุตรยาก',
      'hair-transplant': 'ปลูกผม',
      'ophthalmology': 'จักษุ',
      'orthopedics': 'กระดูกและข้อ',
      'general-medical': 'การแพทย์ทั่วไป',
    },
  },
  mn: {
    title: (name) => `${name} | Эмнэлгийн орчуулагч | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - Солонгосын ${specialty} чиглэлээр мэргэшсэн эмнэлгийн орчуулагч. ${languages} ярьдаг.`,
    specialties: {
      'plastic-surgery': 'Гоо сайхны мэс засал',
      'dermatology': 'Арьс судлал',
      'dental': 'Шүдний эмчилгээ',
      'health-checkup': 'Эрүүл мэндийн үзлэг',
      'fertility': 'Үргүйдэл эмчилгээ',
      'hair-transplant': 'Үс суулгах',
      'ophthalmology': 'Нүдний эмчилгээ',
      'orthopedics': 'Ортопеди',
      'general-medical': 'Ерөнхий эмчилгээ',
    },
  },
  ru: {
    title: (name) => `${name} | Медицинский переводчик | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - Профессиональный медицинский переводчик в Корее, специализация: ${specialty}. Языки: ${languages}.`,
    specialties: {
      'plastic-surgery': 'Пластическая хирургия',
      'dermatology': 'Дерматология',
      'dental': 'Стоматология',
      'health-checkup': 'Медосмотр',
      'fertility': 'Лечение бесплодия',
      'hair-transplant': 'Пересадка волос',
      'ophthalmology': 'Офтальмология',
      'orthopedics': 'Ортопедия',
      'general-medical': 'Общая медицина',
    },
  },
};

// Language names per locale
const languageNames: Record<string, Record<string, string>> = {
  en: { en: 'English', ko: 'Korean', ja: 'Japanese', 'zh-CN': 'Chinese', 'zh-TW': 'Chinese', th: 'Thai', mn: 'Mongolian', ru: 'Russian' },
  ko: { en: '영어', ko: '한국어', ja: '일본어', 'zh-CN': '중국어', 'zh-TW': '중국어', th: '태국어', mn: '몽골어', ru: '러시아어' },
  ja: { en: '英語', ko: '韓国語', ja: '日本語', 'zh-CN': '中国語', 'zh-TW': '中国語', th: 'タイ語', mn: 'モンゴル語', ru: 'ロシア語' },
  'zh-CN': { en: '英语', ko: '韩语', ja: '日语', 'zh-CN': '中文', 'zh-TW': '中文', th: '泰语', mn: '蒙古语', ru: '俄语' },
  'zh-TW': { en: '英語', ko: '韓語', ja: '日語', 'zh-CN': '中文', 'zh-TW': '中文', th: '泰語', mn: '蒙古語', ru: '俄語' },
  th: { en: 'อังกฤษ', ko: 'เกาหลี', ja: 'ญี่ปุ่น', 'zh-CN': 'จีน', 'zh-TW': 'จีน', th: 'ไทย', mn: 'มองโกเลีย', ru: 'รัสเซีย' },
  mn: { en: 'Англи', ko: 'Солонгос', ja: 'Япон', 'zh-CN': 'Хятад', 'zh-TW': 'Хятад', th: 'Тайланд', mn: 'Монгол', ru: 'Орос' },
  ru: { en: 'Английский', ko: 'Корейский', ja: 'Японский', 'zh-CN': 'Китайский', 'zh-TW': 'Китайский', th: 'Тайский', mn: 'Монгольский', ru: 'Русский' },
};

function generateInterpreterSEO(data: SEOPreviewProps['data'], locale: string): SEOData {
  const templates = interpreterSeoTemplates[locale] || interpreterSeoTemplates.en;
  const langNames = languageNames[locale] || languageNames.en;

  const name = data.name?.[locale] || data.name?.['en'] || 'Interpreter';
  const specialtySlug = data.primary_specialty || 'general-medical';
  const specialty = templates.specialties[specialtySlug] || specialtySlug;

  const languages = data.languages
    ? data.languages.map((l) => langNames[l.code] || l.code).join(', ')
    : '';

  const bio = data.bio_short?.[locale] || data.bio_short?.['en'] || '';
  const slug = data.slug || 'interpreter';

  // Use dynamic OG image URL (same as actual metadata)
  const ogImageUrl = `/api/og/interpreter?id=${slug}&locale=${locale}`;

  return {
    title: templates.title(name),
    description: bio || templates.description(name, specialty, languages),
    url: `https://getcarekorea.com/${locale}/interpreters/${slug}`,
    image: ogImageUrl,
    type: 'profile',
  };
}

function generateBlogSEO(data: SEOPreviewProps['data'], locale: string): SEOData {
  // Blog posts have locale-specific content
  const title = typeof data.title === 'string'
    ? data.title
    : data.title?.[locale] || data.title?.['en'] || 'Blog Post';

  const excerpt = typeof data.excerpt === 'string'
    ? data.excerpt
    : data.excerpt?.[locale] || data.excerpt?.['en'] || '';

  return {
    title: `${title} | GetCareKorea Blog`,
    description: excerpt.slice(0, 160) || `Read about ${title} on GetCareKorea Blog`,
    url: `https://getcarekorea.com/${locale}/blog/${data.slug || 'post'}`,
    image: data.cover_image_url || undefined,
    type: 'article',
  };
}

// Google Search Preview Component
function GooglePreview({ seo }: { seo: SEOData }) {
  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
          <Globe className="w-4 h-4 text-violet-600" />
        </div>
        <div className="text-sm">
          <div className="text-xs text-gray-600">getcarekorea.com</div>
          <div className="text-xs text-gray-400 truncate max-w-[300px]">{seo.url}</div>
        </div>
      </div>
      <h3 className="text-blue-800 text-lg font-medium hover:underline cursor-pointer truncate">
        {seo.title}
      </h3>
      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
        {seo.description}
      </p>
    </div>
  );
}

// Social Media Preview Component
function SocialPreview({ seo, platform }: { seo: SEOData; platform: 'facebook' | 'twitter' }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset states when image URL changes (e.g., locale change)
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [seo.image]);

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {seo.image && (
        <div className="aspect-[1.91/1] bg-gray-100 relative">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-sm text-gray-500">OG 이미지 로딩중...</div>
            </div>
          )}
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-sm text-gray-500">이미지를 불러올 수 없습니다</div>
            </div>
          ) : (
            <img
              src={seo.image}
              alt="Preview"
              className="w-full h-full object-cover"
              onLoad={() => setImageLoading(false)}
              onError={() => { setImageError(true); setImageLoading(false); }}
            />
          )}
        </div>
      )}
      <div className="p-3">
        <div className="text-xs text-gray-500 uppercase mb-1">getcarekorea.com</div>
        <h4 className="font-semibold text-gray-900 line-clamp-2">{seo.title}</h4>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{seo.description}</p>
      </div>
    </div>
  );
}

export function SEOPreview({ type, data, defaultLocale = 'en' }: SEOPreviewProps) {
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [isOpen, setIsOpen] = useState(true);

  const seo = type === 'interpreter'
    ? generateInterpreterSEO(data, selectedLocale)
    : generateBlogSEO(data, selectedLocale);

  const selectedLocaleInfo = locales.find((l) => l.code === selectedLocale);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-violet-600" />
                SEO 미리보기
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Locale Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">언어 선택:</span>
              <Select value={selectedLocale} onValueChange={setSelectedLocale}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((locale) => (
                    <SelectItem key={locale.code} value={locale.code}>
                      <span className="flex items-center gap-2">
                        <span>{locale.flag}</span>
                        <span>{locale.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline" className="ml-auto">
                {selectedLocaleInfo?.flag} {selectedLocaleInfo?.name}
              </Badge>
            </div>

            <Tabs defaultValue="google" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="google" className="text-xs">
                  <Search className="w-3 h-3 mr-1" />
                  Google
                </TabsTrigger>
                <TabsTrigger value="facebook" className="text-xs">
                  <Share2 className="w-3 h-3 mr-1" />
                  Facebook
                </TabsTrigger>
                <TabsTrigger value="twitter" className="text-xs">
                  <Share2 className="w-3 h-3 mr-1" />
                  Twitter
                </TabsTrigger>
              </TabsList>

              <TabsContent value="google" className="mt-4">
                <GooglePreview seo={seo} />
              </TabsContent>

              <TabsContent value="facebook" className="mt-4">
                <SocialPreview seo={seo} platform="facebook" />
              </TabsContent>

              <TabsContent value="twitter" className="mt-4">
                <SocialPreview seo={seo} platform="twitter" />
              </TabsContent>
            </Tabs>

            {/* Dynamic OG Image Indicator */}
            {type === 'interpreter' && (
              <div className="flex items-center gap-2 p-2 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
                <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                  동적 OG 이미지
                </Badge>
                <span className="text-xs text-muted-foreground">
                  실제 API에서 생성되는 OG 이미지를 미리보기합니다
                </span>
              </div>
            )}

            {/* Meta Tags Display */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">메타 태그</h4>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex">
                  <span className="text-violet-600 w-24 flex-shrink-0">title:</span>
                  <span className="text-gray-700 break-all">{seo.title}</span>
                </div>
                <div className="flex">
                  <span className="text-violet-600 w-24 flex-shrink-0">description:</span>
                  <span className="text-gray-700 break-all">{seo.description.slice(0, 160)}</span>
                </div>
                <div className="flex">
                  <span className="text-violet-600 w-24 flex-shrink-0">og:type:</span>
                  <span className="text-gray-700">{seo.type}</span>
                </div>
                <div className="flex">
                  <span className="text-violet-600 w-24 flex-shrink-0">og:url:</span>
                  <span className="text-gray-700 break-all">{seo.url}</span>
                </div>
                {seo.image && (
                  <div className="flex">
                    <span className="text-violet-600 w-24 flex-shrink-0">og:image:</span>
                    <span className="text-gray-700 break-all truncate">
                      {seo.image.startsWith('/') ? `https://getcarekorea.com${seo.image}` : seo.image}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Character Count Warnings */}
            <div className="flex gap-4 text-xs">
              <div className={`flex items-center gap-1 ${seo.title.length > 60 ? 'text-amber-600' : 'text-green-600'}`}>
                <span>Title: {seo.title.length}/60</span>
                {seo.title.length > 60 && <span>(권장 초과)</span>}
              </div>
              <div className={`flex items-center gap-1 ${seo.description.length > 160 ? 'text-amber-600' : 'text-green-600'}`}>
                <span>Description: {seo.description.length}/160</span>
                {seo.description.length > 160 && <span>(권장 초과)</span>}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
