'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
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

interface BlogPost {
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

// Format specialty name
function formatSpecialty(specialty: string): string {
  const specialtyMap: Record<string, string> = {
    'plastic-surgery': 'Plastic Surgery',
    'dermatology': 'Dermatology',
    'dental': 'Dental Care',
    'health-checkup': 'Health Checkup',
    'ophthalmology': 'Ophthalmology',
    'orthopedics': 'Orthopedics',
    'fertility': 'Fertility Treatment',
    'hair-transplant': 'Hair Transplant',
    'general': 'General Medical',
  };

  return specialtyMap[specialty] || specialty.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function BlogDetailPage() {
  const locale = useLocale() as Locale;
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Floating CTA state - must be declared before any conditional returns
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [isFloatingExpanded, setIsFloatingExpanded] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/blog/${slug}?locale=${locale}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Post not found');
        }

        setPost(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchPost();
    }
  }, [slug, locale]);

  // Show floating CTA after scrolling - must be declared before any conditional returns
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowFloatingCTA(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get messenger config for floating CTA
  const floatingMessengerCTA = getMessengerCTA(locale, post?.authorPersona);

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format category name
  const formatCategoryName = (category: string): string => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate read time
  const getReadTime = (content: string | null): string => {
    if (!content) return '1 min read';
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'The article you are looking for does not exist or has been removed.'}
          </p>
          <Button asChild>
            <Link href={`/${locale}/blog`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Floating CTA Button */}
      <AnimatePresence>
        {showFloatingCTA && post && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {isFloatingExpanded ? (
              <motion.div
                initial={{ opacity: 0, width: 56, height: 56 }}
                animate={{ opacity: 1, width: 'auto', height: 'auto' }}
                className={`rounded-2xl shadow-2xl p-4 max-w-[320px] ${
                  floatingMessengerCTA.messenger === 'whatsapp' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  floatingMessengerCTA.messenger === 'line' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                  floatingMessengerCTA.messenger === 'kakao' ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                  'bg-gradient-to-br from-violet-500 to-purple-600'
                }`}
              >
                <button
                  onClick={() => setIsFloatingExpanded(false)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>

                <div className="pr-6">
                  <h4 className={`font-bold mb-1 ${floatingMessengerCTA.messenger === 'kakao' ? 'text-black' : 'text-white'}`}>
                    {locale === 'ko' ? '무료 상담 받기' :
                     locale === 'ja' ? '無料相談を受ける' :
                     locale === 'zh-TW' || locale === 'zh-CN' ? '免費諮詢' :
                     locale === 'th' ? 'รับคำปรึกษาฟรี' :
                     locale === 'ru' ? 'Бесплатная консультация' :
                     locale === 'mn' ? 'Үнэгүй зөвлөгөө' :
                     'Get Free Consultation'}
                  </h4>
                  <p className={`text-sm mb-3 ${floatingMessengerCTA.messenger === 'kakao' ? 'text-black/70' : 'text-white/80'}`}>
                    {locale === 'ko' ? '전문가가 1:1로 상담해드립니다' :
                     locale === 'ja' ? '専門家が1対1でご相談します' :
                     locale === 'zh-TW' || locale === 'zh-CN' ? '專家一對一諮詢' :
                     locale === 'th' ? 'ผู้เชี่ยวชาญให้คำปรึกษา' :
                     locale === 'ru' ? 'Индивидуальная консультация' :
                     locale === 'mn' ? 'Мэргэжилтэн зөвлөгөө өгнө' :
                     'Expert 1-on-1 consultation'}
                  </p>

                  <div className="flex flex-col gap-2">
                    <a
                      href={floatingMessengerCTA.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        floatingMessengerCTA.messenger === 'kakao'
                          ? 'bg-black text-yellow-400 hover:bg-black/80'
                          : 'bg-white text-gray-900 hover:bg-white/90'
                      }`}
                    >
                      {floatingMessengerCTA.messenger === 'whatsapp' && (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      )}
                      {floatingMessengerCTA.messenger === 'line' && (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                      )}
                      {floatingMessengerCTA.messenger === 'kakao' && (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                        </svg>
                      )}
                      {floatingMessengerCTA.label}
                    </a>

                    <a
                      href={`/${locale}/contact`}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        floatingMessengerCTA.messenger === 'kakao'
                          ? 'bg-black/20 text-black hover:bg-black/30'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      {locale === 'ko' ? '문의하기' :
                       locale === 'ja' ? 'お問い合わせ' :
                       locale === 'zh-TW' || locale === 'zh-CN' ? '聯繫我們' :
                       locale === 'th' ? 'ติดต่อเรา' :
                       locale === 'ru' ? 'Связаться' :
                       locale === 'mn' ? 'Холбогдох' :
                       'Contact Us'}
                    </a>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFloatingExpanded(true)}
                className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl ${
                  floatingMessengerCTA.messenger === 'whatsapp' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  floatingMessengerCTA.messenger === 'line' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                  floatingMessengerCTA.messenger === 'kakao' ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                  'bg-gradient-to-br from-violet-500 to-purple-600'
                }`}
              >
                {/* Pulse animation */}
                <span className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                  floatingMessengerCTA.messenger === 'whatsapp' || floatingMessengerCTA.messenger === 'line' ? 'bg-green-400' :
                  floatingMessengerCTA.messenger === 'kakao' ? 'bg-yellow-400' :
                  'bg-violet-400'
                }`} />

                <MessageCircle className={`h-6 w-6 ${floatingMessengerCTA.messenger === 'kakao' ? 'text-black' : 'text-white'}`} />

                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  1
                </span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Image */}
      <div className="relative h-[400px] lg:h-[500px]">
        <Image
          src={post.cover_image_url || DEFAULT_IMAGE}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-4 top-4 lg:left-8 lg:top-8"
        >
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white/90 backdrop-blur-sm"
            asChild
          >
            <Link href={`/${locale}/blog`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </motion.div>
      </div>

      <div className="container relative -mt-32 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Article Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="overflow-hidden border-0 shadow-2xl">
              <CardContent className="p-8 lg:p-12">
                {/* Category & Tags */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {post.category && (
                    <Badge className="bg-violet-500 hover:bg-violet-600">
                      {formatCategoryName(post.category)}
                    </Badge>
                  )}
                  {post.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Title */}
                <h1 className="mb-6 text-3xl font-bold lg:text-4xl">
                  {post.title}
                </h1>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="mb-6 text-lg text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta Info */}
                <div className="mb-6 flex flex-wrap items-center gap-4 text-muted-foreground">
                  {post.author && (
                    <>
                      <div className="flex items-center gap-2">
                        {post.author.avatar_url ? (
                          <Image
                            src={post.author.avatar_url}
                            alt={post.author.full_name || 'Author'}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {post.author.full_name || 'GetCareKorea Team'}
                          </p>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                    </>
                  )}
                  {post.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.published_at)}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getReadTime(post.content)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.view_count.toLocaleString()} views
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" size="sm" className="rounded-full gap-2">
                    <Heart className="h-4 w-4" />
                    Like
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full gap-2">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Share:</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => navigator.clipboard.writeText(window.location.href)}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Summary Section - AEO Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <Card className="overflow-hidden border-2 border-violet-200 dark:border-violet-800 shadow-xl bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-950/50 dark:via-background dark:to-purple-950/50">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {locale === 'ko' ? 'AI 요약' :
                       locale === 'ja' ? 'AI要約' :
                       locale === 'zh-TW' || locale === 'zh-CN' ? 'AI摘要' :
                       locale === 'th' ? 'สรุป AI' :
                       locale === 'ru' ? 'AI Резюме' :
                       locale === 'mn' ? 'AI Хураангуй' :
                       'AI Summary'}
                      <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] px-2 py-0.5">
                        <Zap className="h-3 w-3 mr-1" />
                        {locale === 'ko' ? '자동 생성' : 'Auto-generated'}
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'ko' ? '이 글의 핵심 내용을 빠르게 파악하세요' :
                       locale === 'ja' ? 'この記事の要点を素早く把握' :
                       'Quick overview of this article\'s key points'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Key Takeaways - Use actual AI summary data if available */}
                  <div className="p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-violet-100 dark:border-violet-800">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-violet-700 dark:text-violet-300">
                      <ListChecks className="h-4 w-4" />
                      {locale === 'ko' ? '핵심 포인트' :
                       locale === 'ja' ? 'キーポイント' :
                       'Key Takeaways'}
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {post.aiSummary?.keyTakeaways && post.aiSummary.keyTakeaways.length > 0 ? (
                        // Use actual AI-generated key takeaways
                        post.aiSummary.keyTakeaways.map((takeaway, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{takeaway}</span>
                          </li>
                        ))
                      ) : post.excerpt ? (
                        // Fallback: generate from excerpt
                        <>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{post.excerpt.split('.')[0]}.</span>
                          </li>
                          {post.category && (
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>
                                {locale === 'ko' ? `카테고리: ${formatCategoryName(post.category)} - 한국 의료 관광 전문 정보` :
                                 `Category: ${formatCategoryName(post.category)} - Expert medical tourism information in Korea`}
                              </span>
                            </li>
                          )}
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>
                              {locale === 'ko' ? '전문 의료 코디네이터가 검토한 신뢰할 수 있는 정보' :
                               'Trusted information reviewed by professional medical coordinators'}
                            </span>
                          </li>
                        </>
                      ) : (
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>
                            {locale === 'ko' ? '한국 의료 관광에 대한 전문적인 가이드' :
                             'Professional guide to medical tourism in Korea'}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Quick Stats - Use AI summary data if available */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-violet-100 dark:border-violet-800 text-center">
                      {post.aiSummary?.estimatedCost ? (
                        <>
                          <Zap className="h-4 w-4 mx-auto mb-1 text-violet-500" />
                          <p className="text-xs text-muted-foreground">
                            {locale === 'ko' ? '예상 비용' : 'Est. Cost'}
                          </p>
                          <p className="font-semibold text-sm">{post.aiSummary.estimatedCost}</p>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mx-auto mb-1 text-violet-500" />
                          <p className="text-xs text-muted-foreground">
                            {locale === 'ko' ? '읽기 시간' : 'Read time'}
                          </p>
                          <p className="font-semibold text-sm">{getReadTime(post.content)}</p>
                        </>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-violet-100 dark:border-violet-800 text-center">
                      {post.aiSummary?.recommendedStay ? (
                        <>
                          <Calendar className="h-4 w-4 mx-auto mb-1 text-violet-500" />
                          <p className="text-xs text-muted-foreground">
                            {locale === 'ko' ? '권장 체류' : 'Stay'}
                          </p>
                          <p className="font-semibold text-sm">{post.aiSummary.recommendedStay}</p>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mx-auto mb-1 text-violet-500" />
                          <p className="text-xs text-muted-foreground">
                            {locale === 'ko' ? '조회수' : 'Views'}
                          </p>
                          <p className="font-semibold text-sm">{post.view_count.toLocaleString()}</p>
                        </>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-violet-100 dark:border-violet-800 text-center">
                      {post.aiSummary?.recoveryTime ? (
                        <>
                          <Clock className="h-4 w-4 mx-auto mb-1 text-violet-500" />
                          <p className="text-xs text-muted-foreground">
                            {locale === 'ko' ? '회복 기간' : 'Recovery'}
                          </p>
                          <p className="font-semibold text-sm">{post.aiSummary.recoveryTime}</p>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mx-auto mb-1 text-violet-500" />
                          <p className="text-xs text-muted-foreground">
                            {locale === 'ko' ? '카테고리' : 'Category'}
                          </p>
                          <p className="font-semibold text-sm truncate">{formatCategoryName(post.category || 'General')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Author Profile Section (Top) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-8"
          >
            <Card className="overflow-hidden border border-border/50 shadow-lg">
              <CardContent className="p-5 lg:p-6">
                <div className="flex items-center gap-4">
                  {/* Author Avatar */}
                  {post.authorPersona ? (
                    <Link href={`/${locale}/interpreters/${post.authorPersona.slug}`} className="flex-shrink-0">
                      {post.authorPersona.photo_url ? (
                        <Image
                          src={post.authorPersona.photo_url}
                          alt={getLocalizedAuthorName(post.authorPersona, locale)}
                          width={64}
                          height={64}
                          className="rounded-full object-cover ring-2 ring-violet-200 dark:ring-violet-800 hover:ring-violet-400 transition-all"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ring-2 ring-violet-200 dark:ring-violet-800">
                          <User className="h-7 w-7 text-white" />
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-violet-200 dark:ring-violet-800 flex-shrink-0">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                  )}

                  {/* Author Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.authorPersona ? (
                        <Link
                          href={`/${locale}/interpreters/${post.authorPersona.slug}`}
                          className="font-bold hover:text-violet-600 transition-colors"
                        >
                          {getLocalizedAuthorName(post.authorPersona, locale)}
                        </Link>
                      ) : (
                        <span className="font-bold">{getDefaultAuthorName(locale)}</span>
                      )}
                      <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {locale === 'ko' ? '인증됨' : 'Verified'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {post.authorPersona ? (
                        <>Medical Tourism Expert | {post.authorPersona.years_of_experience} Years</>
                      ) : (
                        <>{locale === 'ko' ? '의료 관광 전문 팀' : 'Medical Tourism Expert Team'}</>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.published_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {post.authorPersona?.languages?.slice(0, 3).map(l => l.code.toUpperCase()).join(', ') || 'KO, EN, JA'}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="hidden sm:block flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                      asChild
                    >
                      <a href={floatingMessengerCTA.link} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {locale === 'ko' ? '상담하기' : 'Consult'}
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="overflow-hidden border-0 shadow-xl">
              <CardContent className="p-8 lg:p-12">
                <div
                  className="blog-content"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      if (!post.content) return '<p>No content available.</p>';
                      // Check if content is already HTML (starts with < or contains common HTML tags)
                      const isHTML = post.content.trim().startsWith('<') || /<(p|div|h[1-6]|article|section|img|ul|ol|li)\b/i.test(post.content);
                      if (isHTML) {
                        // Content is HTML, use directly
                        return post.content;
                      } else {
                        // Content is Markdown, convert to HTML
                        return post.content
                          .replace(/\n/g, '<br />')
                          .replace(/#{3} (.*)/g, '<h3>$1</h3>')
                          .replace(/#{2} (.*)/g, '<h2>$1</h2>')
                          .replace(/#{1} (.*)/g, '<h1>$1</h1>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>');
                      }
                    })()
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Related Posts */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12"
            >
              <h2 className="mb-6 text-2xl font-bold">Related Articles</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {post.relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/${locale}/blog/${relatedPost.slug}`}>
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="group overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg transition-all hover:border-violet-500/30 hover:shadow-xl"
                    >
                      <div className="relative h-32 overflow-hidden">
                        <Image
                          src={relatedPost.cover_image_url || DEFAULT_IMAGE}
                          alt={relatedPost.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedPost.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(relatedPost.published_at)}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* About the Author Section - Always Visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-violet-50/20 dark:to-violet-950/20">
              <CardContent className="p-8">
                <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  {locale === 'ko' ? '저자 소개' :
                   locale === 'ja' ? '著者について' :
                   locale === 'zh-TW' || locale === 'zh-CN' ? '關於作者' :
                   locale === 'th' ? 'เกี่ยวกับผู้เขียน' :
                   locale === 'ru' ? 'Об авторе' :
                   locale === 'mn' ? 'Зохиогчийн тухай' :
                   'About the Author'}
                </h2>

                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Author Photo */}
                  <div className="flex-shrink-0">
                    {post.authorPersona ? (
                      <Link href={`/${locale}/interpreters/${post.authorPersona.slug}`}>
                        {post.authorPersona.photo_url ? (
                          <Image
                            src={post.authorPersona.photo_url}
                            alt={getLocalizedAuthorName(post.authorPersona, locale)}
                            width={120}
                            height={120}
                            className="rounded-xl object-cover hover:opacity-90 transition-opacity ring-4 ring-violet-100 dark:ring-violet-900/50"
                          />
                        ) : (
                          <div className="h-[120px] w-[120px] rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center hover:opacity-90 transition-opacity ring-4 ring-violet-200 dark:ring-violet-800">
                            <User className="h-12 w-12 text-white" />
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="h-[120px] w-[120px] rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-violet-200 dark:ring-violet-800">
                        <div className="text-center">
                          <Sparkles className="h-10 w-10 text-white mx-auto mb-1" />
                          <span className="text-[10px] text-white/80 font-medium">EXPERT TEAM</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Author Info */}
                  <div className="flex-1">
                    {post.authorPersona ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Link
                            href={`/${locale}/interpreters/${post.authorPersona.slug}`}
                            className="text-lg font-bold hover:text-violet-600 transition-colors"
                          >
                            {getLocalizedAuthorName(post.authorPersona, locale)}
                          </Link>
                          {post.authorPersona.is_verified && (
                            <Badge className="bg-blue-500 text-white text-xs gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-violet-600 dark:text-violet-400 mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Medical Tourism Interpreter | {post.authorPersona.years_of_experience} Years Experience
                        </p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary" className="bg-violet-100 dark:bg-violet-900/50">
                            {formatSpecialty(post.authorPersona.primary_specialty)}
                          </Badge>
                          {post.authorPersona.secondary_specialties?.slice(0, 2).map((spec) => (
                            <Badge key={spec} variant="outline">
                              {formatSpecialty(spec)}
                            </Badge>
                          ))}
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {post.authorPersona.bio_short_en || post.authorPersona.bio_full_en?.substring(0, 200) + '...'}
                        </p>

                        {/* Languages & Certifications */}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
                          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                            <Globe className="h-3.5 w-3.5 text-violet-500" />
                            <span>
                              {post.authorPersona.languages?.map(l => l.code.toUpperCase()).join(', ') || 'KO, EN'}
                            </span>
                          </div>
                          {post.authorPersona.certifications?.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                              <Award className="h-3.5 w-3.5 text-amber-500" />
                              <span>{post.authorPersona.certifications[0]}</span>
                            </div>
                          )}
                        </div>

                        {/* View Profile Button */}
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2 bg-violet-600 hover:bg-violet-700"
                          asChild
                        >
                          <Link href={`/${locale}/interpreters/${post.authorPersona.slug}`}>
                            <User className="h-4 w-4" />
                            {locale === 'ko' ? '프로필 보기' :
                             locale === 'ja' ? 'プロフィールを見る' :
                             locale === 'zh-TW' || locale === 'zh-CN' ? '查看個人資料' :
                             locale === 'th' ? 'ดูโปรไฟล์' :
                             locale === 'ru' ? 'Посмотреть профиль' :
                             locale === 'mn' ? 'Профайл харах' :
                             'View Profile'}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    ) : post.generatedAuthor ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">
                            {post.generatedAuthor.name_en}
                          </h3>
                          <Badge className="bg-violet-500 text-white text-xs gap-1">
                            <Sparkles className="h-3 w-3" />
                            Expert
                          </Badge>
                        </div>

                        <p className="text-sm text-violet-600 dark:text-violet-400 mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Medical Tourism Interpreter | {post.generatedAuthor.years_of_experience} Years Experience
                        </p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.generatedAuthor.specialties?.slice(0, 3).map((spec) => (
                            <Badge key={spec} variant="secondary" className="bg-violet-100 dark:bg-violet-900/50">
                              {spec}
                            </Badge>
                          ))}
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {post.generatedAuthor.bio_en?.substring(0, 200)}...
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                            <Globe className="h-3.5 w-3.5 text-violet-500" />
                            <span>{post.generatedAuthor.languages?.join(', ') || 'Korean, English'}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Default Author - GetCareKorea Team */
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">
                            {getDefaultAuthorName(locale)}
                          </h3>
                          <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {locale === 'ko' ? '공식' : 'Official'}
                          </Badge>
                        </div>

                        <p className="text-sm text-violet-600 dark:text-violet-400 mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          {locale === 'ko' ? `의료 관광 전문 팀 | ${DEFAULT_AUTHOR.experience}년 이상 경력` :
                           `Medical Tourism Experts | ${DEFAULT_AUTHOR.experience}+ Years Experience`}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {DEFAULT_AUTHOR.specialties.slice(0, 4).map((spec) => (
                            <Badge key={spec} variant="secondary" className="bg-violet-100 dark:bg-violet-900/50">
                              {spec}
                            </Badge>
                          ))}
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {getDefaultAuthorBio(locale)}
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
                          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                            <Globe className="h-3.5 w-3.5 text-violet-500" />
                            <span>{DEFAULT_AUTHOR.languages.slice(0, 4).join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                            <Award className="h-3.5 w-3.5 text-amber-500" />
                            <span>{DEFAULT_AUTHOR.certifications[0]}</span>
                          </div>
                        </div>

                        {/* Contact Team Button */}
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                          asChild
                        >
                          <Link href={`/${locale}/contact`}>
                            <MessageCircle className="h-4 w-4" />
                            {locale === 'ko' ? '팀에 문의하기' :
                             locale === 'ja' ? 'チームに連絡' :
                             locale === 'zh-TW' || locale === 'zh-CN' ? '聯繫團隊' :
                             locale === 'th' ? 'ติดต่อทีม' :
                             locale === 'ru' ? 'Связаться с командой' :
                             locale === 'mn' ? 'Багтай холбогдох' :
                             'Contact Our Team'}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Locale-Specific CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            {(() => {
              const messengerCTA = getMessengerCTA(locale, post.authorPersona);
              const isWhatsApp = messengerCTA.messenger === 'whatsapp';
              const isLine = messengerCTA.messenger === 'line';
              const isKakao = messengerCTA.messenger === 'kakao';

              return (
                <div className={`relative overflow-hidden rounded-2xl border p-8 ${
                  isWhatsApp ? 'border-green-500/30 bg-gradient-to-r from-green-950/50 via-green-900/50 to-green-950/50' :
                  isLine ? 'border-green-500/30 bg-gradient-to-r from-green-950/50 via-emerald-900/50 to-green-950/50' :
                  isKakao ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-950/50 via-amber-900/50 to-yellow-950/50' :
                  'border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-purple-900/50 to-violet-950/50'
                }`}>
                  <div className={`absolute -left-10 -top-10 h-40 w-40 rounded-full blur-3xl ${
                    isWhatsApp || isLine ? 'bg-green-500/20' :
                    isKakao ? 'bg-yellow-500/20' :
                    'bg-violet-500/20'
                  }`} />
                  <div className={`absolute -bottom-10 -right-10 h-40 w-40 rounded-full blur-3xl ${
                    isWhatsApp || isLine ? 'bg-emerald-500/20' :
                    isKakao ? 'bg-amber-500/20' :
                    'bg-cyan-500/20'
                  }`} />

                  <div className="relative z-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${
                      isWhatsApp ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      isLine ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                      isKakao ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                      'bg-gradient-to-br from-violet-500 to-purple-600'
                    }`}>
                      {isWhatsApp ? (
                        <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      ) : isLine ? (
                        <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                      ) : isKakao ? (
                        <svg className="h-8 w-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 00-.656-.678l-1.928 1.866V9.282a.472.472 0 00-.944 0v2.557a.471.471 0 000 .222V13.5a.472.472 0 00.944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 10.773-.543l-1.514-2.154zm-2.958 1.924h-1.46V9.297a.472.472 0 00-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 100-.944zm-5.857-1.091l.696-1.707.638 1.707H9.092zm2.523.487l.002-.016a.469.469 0 00-.127-.32l-1.22-2.374a.544.544 0 00-.49-.284h-.016a.543.543 0 00-.49.284l-1.574 3.06a.472.472 0 00.869.37l.367-.9h1.912l.322.86a.472.472 0 10.884-.327l-.439-1.353zm-5.553.575l-.001-.001-.001-.001a.4695.4695 0 00-.47-.47h-.944V9.282a.472.472 0 00-.944 0V13.5c0 .26.21.471.472.471h1.416a.472.472 0 00.472-.471v-.001-.015-.001z"/>
                        </svg>
                      ) : (
                        <Sparkles className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-xl font-bold text-white">
                        {locale === 'ko' ? '무료 상담을 받아보세요' :
                         locale === 'ja' ? '無料相談を受けてみませんか？' :
                         locale === 'zh-TW' || locale === 'zh-CN' ? '獲取免費諮詢' :
                         locale === 'th' ? 'รับคำปรึกษาฟรี' :
                         locale === 'ru' ? 'Получите бесплатную консультацию' :
                         locale === 'mn' ? 'Үнэгүй зөвлөгөө аваарай' :
                         'Ready to Start Your Journey?'}
                      </h3>
                      <p className="text-white/70">
                        {locale === 'ko' ? '전문 의료 관광 코디네이터가 도와드립니다.' :
                         locale === 'ja' ? '専門の医療観光コーディネーターがお手伝いします。' :
                         locale === 'zh-TW' || locale === 'zh-CN' ? '專業醫療旅遊協調員將為您提供幫助。' :
                         locale === 'th' ? 'ผู้ประสานงานการท่องเที่ยวเชิงการแพทย์จะช่วยเหลือคุณ' :
                         locale === 'ru' ? 'Наши координаторы медицинского туризма помогут вам.' :
                         locale === 'mn' ? 'Эмнэлгийн аялал жуулчлалын зохицуулагч танд туслах болно.' :
                         'Get a free consultation with our medical tourism experts.'}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className={`${
                        isWhatsApp ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' :
                        isLine ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' :
                        isKakao ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black' :
                        'bg-gradient-to-r from-violet-600 to-purple-600'
                      } text-white`}
                      asChild
                    >
                      <a href={messengerCTA.link} target="_blank" rel="noopener noreferrer">
                        {messengerCTA.label}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
