'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Eye,
  MessageCircle,
  Share2,
  Bookmark,
  Heart,
  ChevronRight,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Sparkles,
  User,
  Tag,
  Loader2,
  AlertCircle,
  X,
  Phone,
  CheckCircle,
  Award,
  Globe,
  Bot,
  Zap,
  FileText,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Locale } from '@/lib/i18n/config';

interface AuthorPersona {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string;
  name_zh_tw: string | null;
  name_zh_cn: string | null;
  name_ja: string | null;
  name_th: string | null;
  name_mn: string | null;
  name_ru: string | null;
  photo_url: string | null;
  years_of_experience: number;
  target_locales: string[];
  primary_specialty: string;
  secondary_specialties: string[];
  languages: Array<{ code: string; proficiency: string }>;
  certifications: string[];
  bio_short_en: string | null;
  bio_full_en: string | null;
  preferred_messenger: string | null;
  messenger_cta_text: Record<string, string>;
  is_verified: boolean;
}

interface GeneratedAuthor {
  name: string;
  name_en: string;
  years_of_experience: number;
  specialties: string[];
  languages: string[];
  certifications: string[];
  bio_en: string;
}

interface AISummary {
  keyTakeaways?: string[];
  quickAnswer?: string;
  targetAudience?: string;
  estimatedCost?: string;
  recommendedStay?: string;
  recoveryTime?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  cover_image_url: string | null;
  category: string;
  tags: string[] | null;
  published_at: string | null;
  view_count: number;
  aiSummary?: AISummary | null;
  faqSchema?: Array<{ question: string; answer: string }> | null;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  authorPersona?: AuthorPersona | null;
  generatedAuthor?: GeneratedAuthor | null;
  relatedPosts?: Array<{
    id: string;
    slug: string;
    title: string;
    cover_image_url: string | null;
    published_at: string | null;
  }>;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200';

// Default author info when no authorPersona is available
const DEFAULT_AUTHOR = {
  name_en: 'GetCareKorea Medical Team',
  name_ko: 'GetCareKorea 의료팀',
  name_ja: 'GetCareKorea医療チーム',
  name_zh: 'GetCareKorea医疗团队',
  name_th: 'ทีมแพทย์ GetCareKorea',
  name_ru: 'Медицинская команда GetCareKorea',
  name_mn: 'GetCareKorea эмнэлгийн баг',
  bio_en: 'Our expert team consists of certified medical tourism coordinators with years of experience helping international patients receive world-class healthcare in Korea. We specialize in connecting you with top-rated hospitals and clinics for procedures including plastic surgery, dermatology, dental care, and comprehensive health checkups.',
  bio_ko: '저희 전문 팀은 수년간 국제 환자들이 한국에서 세계적 수준의 의료 서비스를 받을 수 있도록 도와온 공인 의료 관광 코디네이터로 구성되어 있습니다.',
  specialties: ['Plastic Surgery', 'Dermatology', 'Dental Care', 'Health Checkups'],
  languages: ['Korean', 'English', 'Japanese', 'Chinese', 'Thai', 'Russian'],
  experience: 10,
  certifications: ['MTQUA Certified', 'Korean Medical Tourism Coordinator'],
};

// Get default author name by locale
function getDefaultAuthorName(locale: string): string {
  const nameMap: Record<string, string> = {
    'ko': DEFAULT_AUTHOR.name_ko,
    'en': DEFAULT_AUTHOR.name_en,
    'ja': DEFAULT_AUTHOR.name_ja,
    'zh-TW': DEFAULT_AUTHOR.name_zh,
    'zh-CN': DEFAULT_AUTHOR.name_zh,
    'th': DEFAULT_AUTHOR.name_th,
    'ru': DEFAULT_AUTHOR.name_ru,
    'mn': DEFAULT_AUTHOR.name_mn,
  };
  return nameMap[locale] || DEFAULT_AUTHOR.name_en;
}

// Get default author bio by locale
function getDefaultAuthorBio(locale: string): string {
  if (locale === 'ko') return DEFAULT_AUTHOR.bio_ko;
  return DEFAULT_AUTHOR.bio_en;
}

// Messenger configuration by locale
const MESSENGER_CONFIG: Record<string, { messenger: string; icon: string; link: string; label: string }> = {
  'en': { messenger: 'whatsapp', icon: '📱', link: 'https://wa.me/821012345678', label: 'Get Free Consultation via WhatsApp' },
  'ru': { messenger: 'whatsapp', icon: '📱', link: 'https://wa.me/821012345678', label: 'Бесплатная консультация через WhatsApp' },
  'mn': { messenger: 'whatsapp', icon: '📱', link: 'https://wa.me/821012345678', label: 'WhatsApp-аар үнэгүй зөвлөгөө авах' },
  'zh-TW': { messenger: 'line', icon: '💬', link: 'https://line.me/ti/p/@getcarekorea', label: 'LINE免費諮詢' },
  'zh-CN': { messenger: 'line', icon: '💬', link: 'https://line.me/ti/p/@getcarekorea', label: 'LINE免费咨询' },
  'ja': { messenger: 'line', icon: '💬', link: 'https://line.me/ti/p/@getcarekorea', label: 'LINEで無料相談' },
  'th': { messenger: 'line', icon: '💬', link: 'https://line.me/ti/p/@getcarekorea', label: 'ปรึกษาฟรีผ่าน LINE' },
  'ko': { messenger: 'kakao', icon: '💬', link: 'https://pf.kakao.com/_getcarekorea', label: '카카오톡 무료상담' },
};

// Get localized author name
function getLocalizedAuthorName(persona: AuthorPersona, locale: string): string {
  const nameMap: Record<string, keyof AuthorPersona> = {
    'ko': 'name_ko',
    'en': 'name_en',
    'zh-TW': 'name_zh_tw',
    'zh-CN': 'name_zh_cn',
    'ja': 'name_ja',
    'th': 'name_th',
    'mn': 'name_mn',
    'ru': 'name_ru',
  };

  const key = nameMap[locale] || 'name_en';
  return (persona[key] as string | null) || persona.name_en;
}

// Get messenger CTA for locale
function getMessengerCTA(locale: string, persona?: AuthorPersona | null): { messenger: string; label: string; link: string } {
  // First check if persona has custom CTA
  if (persona?.messenger_cta_text?.[locale]) {
    const defaultConfig = MESSENGER_CONFIG[locale] || MESSENGER_CONFIG['en'];
    return {
      messenger: persona.preferred_messenger || defaultConfig.messenger,
      label: persona.messenger_cta_text[locale],
      link: defaultConfig.link,
    };
  }

  // Fall back to default config
  return MESSENGER_CONFIG[locale] || MESSENGER_CONFIG['en'];
}

// Translations
const translations: Record<string, Record<string, string>> = {
  'en': {
    back: 'Back to Blog',
    readTime: 'min read',
    views: 'views',
    share: 'Share',
    bookmark: 'Save',
    like: 'Like',
    relatedPosts: 'Related Articles',
    tags: 'Tags',
    author: 'Written by',
    yearsExp: 'years experience',
    verified: 'Verified Expert',
    aboutAuthor: 'About the Author',
    specialties: 'Specialties',
    languages: 'Languages',
    certifications: 'Certifications',
    freeConsult: 'Get Free Consultation',
    tableOfContents: 'Table of Contents',
    aiSummary: 'AI Quick Summary',
    keyTakeaways: 'Key Takeaways',
    quickAnswer: 'Quick Answer',
    targetAudience: 'Who is this for?',
    estimatedCost: 'Estimated Cost',
    recommendedStay: 'Recommended Stay',
    recoveryTime: 'Recovery Time',
    faq: 'Frequently Asked Questions',
    loading: 'Loading...',
    notFound: 'Post not found',
    error: 'Something went wrong',
    ctaTitle: 'Ready to Start Your Medical Journey?',
    ctaDesc: 'Get personalized consultation from our expert medical coordinators',
    ctaButton: 'Contact Us Now',
    inContentCtaTitle: 'Need Expert Guidance?',
    inContentCtaDesc: 'Our medical coordinators can help you find the right treatment and hospital for your needs.',
    inContentCtaButton: 'Get Free Consultation',
  },
  'ko': {
    back: '블로그로 돌아가기',
    readTime: '분 소요',
    views: '조회',
    share: '공유',
    bookmark: '저장',
    like: '좋아요',
    relatedPosts: '관련 글',
    tags: '태그',
    author: '작성자',
    yearsExp: '년 경력',
    verified: '인증 전문가',
    aboutAuthor: '저자 소개',
    specialties: '전문 분야',
    languages: '사용 언어',
    certifications: '자격증',
    freeConsult: '무료 상담 받기',
    tableOfContents: '목차',
    aiSummary: 'AI 요약',
    keyTakeaways: '핵심 포인트',
    quickAnswer: '빠른 답변',
    targetAudience: '이런 분께 추천',
    estimatedCost: '예상 비용',
    recommendedStay: '권장 체류 기간',
    recoveryTime: '회복 기간',
    faq: '자주 묻는 질문',
    loading: '로딩 중...',
    notFound: '게시글을 찾을 수 없습니다',
    error: '문제가 발생했습니다',
    ctaTitle: '의료 여정을 시작할 준비가 되셨나요?',
    ctaDesc: '전문 의료 코디네이터의 맞춤 상담을 받아보세요',
    ctaButton: '지금 상담하기',
    inContentCtaTitle: '전문가의 도움이 필요하신가요?',
    inContentCtaDesc: '저희 의료 코디네이터가 당신에게 맞는 치료와 병원을 찾는 것을 도와드립니다.',
    inContentCtaButton: '무료 상담 받기',
  },
  'ja': {
    back: 'ブログに戻る',
    readTime: '分で読める',
    views: '閲覧',
    share: 'シェア',
    bookmark: '保存',
    like: 'いいね',
    relatedPosts: '関連記事',
    tags: 'タグ',
    author: '著者',
    yearsExp: '年の経験',
    verified: '認定専門家',
    aboutAuthor: '著者について',
    specialties: '専門分野',
    languages: '対応言語',
    certifications: '資格',
    freeConsult: '無料相談を受ける',
    tableOfContents: '目次',
    aiSummary: 'AIサマリー',
    keyTakeaways: 'ポイント',
    quickAnswer: 'クイック回答',
    targetAudience: 'おすすめの方',
    estimatedCost: '想定費用',
    recommendedStay: '推奨滞在期間',
    recoveryTime: '回復期間',
    faq: 'よくある質問',
    loading: '読み込み中...',
    notFound: '記事が見つかりません',
    error: '問題が発生しました',
    ctaTitle: '医療の旅を始める準備はできましたか？',
    ctaDesc: '専門の医療コーディネーターによるパーソナライズされた相談を受けましょう',
    ctaButton: '今すぐお問い合わせ',
    inContentCtaTitle: '専門家のサポートが必要ですか？',
    inContentCtaDesc: '当社の医療コーディネーターが、お客様に最適な治療と病院を見つけるお手伝いをいたします。',
    inContentCtaButton: '無料相談を受ける',
  },
  'zh-TW': {
    back: '返回部落格',
    readTime: '分鐘閱讀',
    views: '瀏覽',
    share: '分享',
    bookmark: '收藏',
    like: '按讚',
    relatedPosts: '相關文章',
    tags: '標籤',
    author: '作者',
    yearsExp: '年經驗',
    verified: '認證專家',
    aboutAuthor: '關於作者',
    specialties: '專業領域',
    languages: '使用語言',
    certifications: '認證',
    freeConsult: '獲取免費諮詢',
    tableOfContents: '目錄',
    aiSummary: 'AI摘要',
    keyTakeaways: '重點',
    quickAnswer: '快速回答',
    targetAudience: '適合對象',
    estimatedCost: '預估費用',
    recommendedStay: '建議停留時間',
    recoveryTime: '恢復時間',
    faq: '常見問題',
    loading: '載入中...',
    notFound: '找不到文章',
    error: '發生錯誤',
    ctaTitle: '準備開始您的醫療之旅了嗎？',
    ctaDesc: '獲取我們專業醫療協調員的個性化諮詢',
    ctaButton: '立即聯繫我們',
    inContentCtaTitle: '需要專家指導嗎？',
    inContentCtaDesc: '我們的醫療協調員可以幫助您找到適合您需求的治療和醫院。',
    inContentCtaButton: '獲取免費諮詢',
  },
  'zh-CN': {
    back: '返回博客',
    readTime: '分钟阅读',
    views: '浏览',
    share: '分享',
    bookmark: '收藏',
    like: '点赞',
    relatedPosts: '相关文章',
    tags: '标签',
    author: '作者',
    yearsExp: '年经验',
    verified: '认证专家',
    aboutAuthor: '关于作者',
    specialties: '专业领域',
    languages: '使用语言',
    certifications: '认证',
    freeConsult: '获取免费咨询',
    tableOfContents: '目录',
    aiSummary: 'AI摘要',
    keyTakeaways: '重点',
    quickAnswer: '快速回答',
    targetAudience: '适合对象',
    estimatedCost: '预估费用',
    recommendedStay: '建议停留时间',
    recoveryTime: '恢复时间',
    faq: '常见问题',
    loading: '加载中...',
    notFound: '找不到文章',
    error: '发生错误',
    ctaTitle: '准备开始您的医疗之旅了吗？',
    ctaDesc: '获取我们专业医疗协调员的个性化咨询',
    ctaButton: '立即联系我们',
    inContentCtaTitle: '需要专家指导吗？',
    inContentCtaDesc: '我们的医疗协调员可以帮助您找到适合您需求的治疗和医院。',
    inContentCtaButton: '获取免费咨询',
  },
  'th': {
    back: 'กลับไปบล็อก',
    readTime: 'นาทีในการอ่าน',
    views: 'การดู',
    share: 'แชร์',
    bookmark: 'บันทึก',
    like: 'ถูกใจ',
    relatedPosts: 'บทความที่เกี่ยวข้อง',
    tags: 'แท็ก',
    author: 'ผู้เขียน',
    yearsExp: 'ปีประสบการณ์',
    verified: 'ผู้เชี่ยวชาญที่ได้รับการรับรอง',
    aboutAuthor: 'เกี่ยวกับผู้เขียน',
    specialties: 'ความเชี่ยวชาญ',
    languages: 'ภาษา',
    certifications: 'ใบรับรอง',
    freeConsult: 'รับคำปรึกษาฟรี',
    tableOfContents: 'สารบัญ',
    aiSummary: 'สรุป AI',
    keyTakeaways: 'ประเด็นสำคัญ',
    quickAnswer: 'คำตอบด่วน',
    targetAudience: 'เหมาะสำหรับใคร',
    estimatedCost: 'ค่าใช้จ่ายโดยประมาณ',
    recommendedStay: 'ระยะเวลาพักที่แนะนำ',
    recoveryTime: 'ระยะเวลาฟื้นตัว',
    faq: 'คำถามที่พบบ่อย',
    loading: 'กำลังโหลด...',
    notFound: 'ไม่พบบทความ',
    error: 'เกิดข้อผิดพลาด',
    ctaTitle: 'พร้อมเริ่มต้นการเดินทางทางการแพทย์ของคุณหรือยัง?',
    ctaDesc: 'รับคำปรึกษาส่วนบุคคลจากผู้ประสานงานการแพทย์ผู้เชี่ยวชาญของเรา',
    ctaButton: 'ติดต่อเราตอนนี้',
    inContentCtaTitle: 'ต้องการคำแนะนำจากผู้เชี่ยวชาญหรือไม่?',
    inContentCtaDesc: 'ผู้ประสานงานการแพทย์ของเราสามารถช่วยคุณค้นหาการรักษาและโรงพยาบาลที่เหมาะสมกับความต้องการของคุณ',
    inContentCtaButton: 'รับคำปรึกษาฟรี',
  },
  'ru': {
    back: 'Вернуться в блог',
    readTime: 'мин чтения',
    views: 'просмотров',
    share: 'Поделиться',
    bookmark: 'Сохранить',
    like: 'Нравится',
    relatedPosts: 'Похожие статьи',
    tags: 'Теги',
    author: 'Автор',
    yearsExp: 'лет опыта',
    verified: 'Проверенный эксперт',
    aboutAuthor: 'Об авторе',
    specialties: 'Специализация',
    languages: 'Языки',
    certifications: 'Сертификаты',
    freeConsult: 'Получить бесплатную консультацию',
    tableOfContents: 'Содержание',
    aiSummary: 'AI Резюме',
    keyTakeaways: 'Ключевые моменты',
    quickAnswer: 'Быстрый ответ',
    targetAudience: 'Для кого это?',
    estimatedCost: 'Ориентировочная стоимость',
    recommendedStay: 'Рекомендуемое пребывание',
    recoveryTime: 'Время восстановления',
    faq: 'Часто задаваемые вопросы',
    loading: 'Загрузка...',
    notFound: 'Статья не найдена',
    error: 'Что-то пошло не так',
    ctaTitle: 'Готовы начать свое медицинское путешествие?',
    ctaDesc: 'Получите персональную консультацию от наших экспертных медицинских координаторов',
    ctaButton: 'Свяжитесь с нами сейчас',
    inContentCtaTitle: 'Нужна помощь эксперта?',
    inContentCtaDesc: 'Наши медицинские координаторы помогут вам найти подходящее лечение и больницу для ваших нужд.',
    inContentCtaButton: 'Получить бесплатную консультацию',
  },
  'mn': {
    back: 'Блог руу буцах',
    readTime: 'минутын унших',
    views: 'үзсэн',
    share: 'Хуваалцах',
    bookmark: 'Хадгалах',
    like: 'Таалагдсан',
    relatedPosts: 'Холбоотой нийтлэлүүд',
    tags: 'Шошго',
    author: 'Зохиогч',
    yearsExp: 'жилийн туршлага',
    verified: 'Баталгаажсан мэргэжилтэн',
    aboutAuthor: 'Зохиогчийн тухай',
    specialties: 'Мэргэшил',
    languages: 'Хэлүүд',
    certifications: 'Гэрчилгээ',
    freeConsult: 'Үнэгүй зөвлөгөө авах',
    tableOfContents: 'Агуулга',
    aiSummary: 'AI Товчлол',
    keyTakeaways: 'Гол санаанууд',
    quickAnswer: 'Шуурхай хариулт',
    targetAudience: 'Хэнд зориулсан?',
    estimatedCost: 'Тооцоолсон зардал',
    recommendedStay: 'Санал болгох хугацаа',
    recoveryTime: 'Сэргэх хугацаа',
    faq: 'Түгээмэл асуултууд',
    loading: 'Ачааллаж байна...',
    notFound: 'Нийтлэл олдсонгүй',
    error: 'Алдаа гарлаа',
    ctaTitle: 'Эмнэлгийн аялалаа эхлүүлэхэд бэлэн үү?',
    ctaDesc: 'Манай мэргэжилтэн эмнэлгийн зохицуулагчдаас хувийн зөвлөгөө авах',
    ctaButton: 'Одоо холбогдох',
    inContentCtaTitle: 'Мэргэжилтний зөвлөгөө хэрэгтэй юу?',
    inContentCtaDesc: 'Манай эмнэлгийн зохицуулагчид таны хэрэгцээнд тохирсон эмчилгээ болон эмнэлгийг олоход тусална.',
    inContentCtaButton: 'Үнэгүй зөвлөгөө авах',
  },
};

function getTranslation(locale: string, key: string): string {
  return translations[locale]?.[key] || translations['en'][key] || key;
}

// Calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Extract headings for table of contents
function extractHeadings(content: string): Array<{ id: string; text: string; level: number }> {
  const headingRegex = /<h([2-3])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h\1>/g;
  const headings: Array<{ id: string; text: string; level: number }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      id: match[2],
      text: match[3],
      level: parseInt(match[1]),
    });
  }

  // Also try to extract headings without IDs
  const simpleHeadingRegex = /<h([2-3])[^>]*>([^<]+)<\/h\1>/g;
  while ((match = simpleHeadingRegex.exec(content)) !== null) {
    const text = match[2];
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!headings.some(h => h.text === text)) {
      headings.push({
        id,
        text,
        level: parseInt(match[1]),
      });
    }
  }

  return headings;
}

interface Props {
  initialPost: BlogPost | null;
  slug: string;
}

export default function BlogPostClient({ initialPost, slug }: Props) {
  const locale = useLocale() as Locale;
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>('');

  const t = useCallback((key: string) => getTranslation(locale, key), [locale]);

  // Fetch post data if not provided initially
  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
      return;
    }

    async function fetchPost() {
      try {
        const response = await fetch(`/api/blog/${slug}?locale=${locale}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        const data = await response.json();
        setPost(data);
      } catch {
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug, locale, initialPost, t]);

  // Track scroll for active heading
  useEffect(() => {
    if (!post?.content) return;

    const headings = extractHeadings(post.content);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [post?.content]);

  // Update view count
  useEffect(() => {
    if (post?.id) {
      fetch(`/api/blog/${slug}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [post?.id, slug]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Fallback
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-xl font-semibold">{error || t('notFound')}</h1>
        <Link href={`/${locale}/blog`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>
        </Link>
      </div>
    );
  }

  const readingTime = calculateReadingTime(post.content || '');
  const headings = extractHeadings(post.content || '');
  const messengerCTA = getMessengerCTA(locale, post.authorPersona);

  // Get author info
  const authorName = post.authorPersona
    ? getLocalizedAuthorName(post.authorPersona, locale)
    : post.generatedAuthor?.name || getDefaultAuthorName(locale);

  const authorBio = post.authorPersona?.bio_short_en
    || post.generatedAuthor?.bio_en
    || getDefaultAuthorBio(locale);

  const authorExperience = post.authorPersona?.years_of_experience
    || post.generatedAuthor?.years_of_experience
    || DEFAULT_AUTHOR.experience;

  const authorSpecialties = post.authorPersona?.secondary_specialties
    || post.generatedAuthor?.specialties
    || DEFAULT_AUTHOR.specialties;

  const authorLanguages = post.authorPersona?.languages?.map(l => l.code)
    || post.generatedAuthor?.languages
    || DEFAULT_AUTHOR.languages;

  const authorCertifications = post.authorPersona?.certifications
    || post.generatedAuthor?.certifications
    || DEFAULT_AUTHOR.certifications;

  const isVerified = post.authorPersona?.is_verified || false;

  // Render content with in-content CTA
  const renderContentWithCTA = () => {
    if (!post.content) return null;

    // Split content roughly in half (after a paragraph)
    const paragraphs = post.content.split('</p>');
    const midpoint = Math.floor(paragraphs.length / 2);

    if (paragraphs.length < 4) {
      // If content is too short, just render it
      return <div dangerouslySetInnerHTML={{ __html: post.content }} />;
    }

    const firstHalf = paragraphs.slice(0, midpoint).join('</p>') + '</p>';
    const secondHalf = paragraphs.slice(midpoint).join('</p>');

    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: firstHalf }} />

        {/* In-content CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="my-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-1">{t('inContentCtaTitle')}</h4>
              <p className="text-muted-foreground text-sm mb-4">{t('inContentCtaDesc')}</p>
              <a href={messengerCTA.link} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {t('inContentCtaButton')}
                </Button>
              </a>
            </div>
          </div>
        </motion.div>

        <div dangerouslySetInnerHTML={{ __html: secondHalf }} />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="container max-w-4xl mx-auto px-4 pt-6">
        <Link href={`/${locale}/blog`}>
          <Button variant="ghost" className="gap-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative"
      >
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs">
              {post.category}
            </Badge>
            {post.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {post.published_at && new Date(post.published_at).toLocaleDateString(locale)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {readingTime} {t('readTime')}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.view_count.toLocaleString()} {t('views')}
            </div>
          </div>

          {/* Author card */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    {post.authorPersona?.photo_url ? (
                      <Image
                        src={post.authorPersona.photo_url}
                        alt={authorName}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  {isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{authorName}</span>
                    {isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        {t('verified')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {authorExperience} {t('yearsExp')}
                  </p>
                </div>
                <a href={messengerCTA.link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {t('freeConsult')}
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Cover image */}
          {post.cover_image_url && (
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
              <Image
                src={post.cover_image_url || DEFAULT_IMAGE}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Table of Contents */}
              {headings.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <ListChecks className="w-4 h-4" />
                      {t('tableOfContents')}
                    </h3>
                    <nav className="space-y-1">
                      {headings.map(({ id, text, level }) => (
                        <a
                          key={id}
                          href={`#${id}`}
                          className={`block text-sm py-1 transition-colors ${
                            level === 3 ? 'pl-4' : ''
                          } ${
                            activeHeading === id
                              ? 'text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {text}
                        </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  variant={isLiked ? 'default' : 'outline'}
                  className="w-full justify-start gap-2"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  {t('like')}
                </Button>
                <Button
                  variant={isBookmarked ? 'default' : 'outline'}
                  className="w-full justify-start gap-2"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  {t('bookmark')}
                </Button>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                  >
                    <Share2 className="w-4 h-4" />
                    {t('share')}
                  </Button>
                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg p-2 z-10"
                      >
                        <a
                          href={shareLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted"
                        >
                          <Facebook className="w-4 h-4" />
                          Facebook
                        </a>
                        <a
                          href={shareLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted"
                        >
                          <Twitter className="w-4 h-4" />
                          Twitter
                        </a>
                        <a
                          href={shareLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted"
                        >
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </a>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted w-full"
                        >
                          <Link2 className="w-4 h-4" />
                          Copy Link
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Article */}
          <article className="lg:col-span-6">
            {/* AI Summary */}
            {post.aiSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Bot className="w-5 h-5 text-purple-500" />
                      <h3 className="font-semibold">{t('aiSummary')}</h3>
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    </div>

                    {post.aiSummary.quickAnswer && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {t('quickAnswer')}
                        </p>
                        <p>{post.aiSummary.quickAnswer}</p>
                      </div>
                    )}

                    {post.aiSummary.keyTakeaways && post.aiSummary.keyTakeaways.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {t('keyTakeaways')}
                        </p>
                        <ul className="space-y-2">
                          {post.aiSummary.keyTakeaways.map((takeaway, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {post.aiSummary.estimatedCost && (
                        <div>
                          <p className="text-muted-foreground">{t('estimatedCost')}</p>
                          <p className="font-medium">{post.aiSummary.estimatedCost}</p>
                        </div>
                      )}
                      {post.aiSummary.recommendedStay && (
                        <div>
                          <p className="text-muted-foreground">{t('recommendedStay')}</p>
                          <p className="font-medium">{post.aiSummary.recommendedStay}</p>
                        </div>
                      )}
                      {post.aiSummary.recoveryTime && (
                        <div>
                          <p className="text-muted-foreground">{t('recoveryTime')}</p>
                          <p className="font-medium">{post.aiSummary.recoveryTime}</p>
                        </div>
                      )}
                      {post.aiSummary.targetAudience && (
                        <div>
                          <p className="text-muted-foreground">{t('targetAudience')}</p>
                          <p className="font-medium">{post.aiSummary.targetAudience}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Article content with in-content CTA */}
            <div className="blog-content max-w-none">
              {renderContentWithCTA()}
            </div>

            {/* FAQ Section */}
            {post.faqSchema && post.faqSchema.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-12"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  {t('faq')}
                </h2>
                <div className="space-y-4">
                  {post.faqSchema.map((faq, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{faq.question}</h3>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/${locale}/blog?tag=${tag}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Right Sidebar - Author & CTA */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Author Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('aboutAuthor')}
                  </h3>

                  <div className="text-center mb-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-3">
                      {post.authorPersona?.photo_url ? (
                        <Image
                          src={post.authorPersona.photo_url}
                          alt={authorName}
                          width={80}
                          height={80}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <h4 className="font-semibold">{authorName}</h4>
                    {isVerified && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('verified')}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{authorBio}</p>

                  <Separator className="my-4" />

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {t('specialties')}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {authorSpecialties.slice(0, 3).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {t('languages')}
                      </p>
                      <p className="text-xs mt-1">{authorLanguages.join(', ')}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {t('certifications')}
                      </p>
                      <ul className="text-xs mt-1 space-y-0.5">
                        {authorCertifications.slice(0, 2).map((cert) => (
                          <li key={cert}>• {cert}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA Card */}
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-90" />
                  <h3 className="font-semibold mb-2">{t('ctaTitle')}</h3>
                  <p className="text-sm opacity-90 mb-4">{t('ctaDesc')}</p>
                  <a href={messengerCTA.link} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="w-full gap-2">
                      <Phone className="w-4 h-4" />
                      {t('ctaButton')}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <ChevronRight className="w-6 h-6" />
              {t('relatedPosts')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {post.relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/${locale}/blog/${relatedPost.slug}`}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="relative aspect-video">
                      <Image
                        src={relatedPost.cover_image_url || DEFAULT_IMAGE}
                        alt={relatedPost.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.published_at && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(relatedPost.published_at).toLocaleDateString(locale)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Mobile action bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-50">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <a href={messengerCTA.link} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                {t('freeConsult')}
              </Button>
            </a>
          </div>

          {/* Mobile share menu */}
          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-background border rounded-lg shadow-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">{t('share')}</h4>
                  <button onClick={() => setShowShareMenu(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <a
                    href={shareLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <Facebook className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs">Facebook</span>
                  </a>
                  <a
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center">
                      <Twitter className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs">Twitter</span>
                  </a>
                  <a
                    href={shareLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center">
                      <Linkedin className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs">LinkedIn</span>
                  </a>
                  <button
                    onClick={copyToClipboard}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center">
                      <Link2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs">Copy</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
