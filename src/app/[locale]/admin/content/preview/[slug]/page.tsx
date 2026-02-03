'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Send,
  RefreshCw,
  Search,
  Globe,
  Eye,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BlogPostClient, { type BlogPost } from '@/app/[locale]/blog/[slug]/BlogPostClient';
import { getCategoryName } from '@/lib/i18n/translations';

// Mock author data for preview - locale-specific
const MOCK_AUTHORS: Record<string, {
  name: string;
  name_en: string;
  years_of_experience: number;
  specialties: string[];
  languages: string[];
  certifications: string[];
  bio_en: string;
}> = {
  en: {
    name: 'Dr. Kim Soo-hyun',
    name_en: 'Dr. Kim Soo-hyun',
    years_of_experience: 12,
    specialties: ['Plastic Surgery', 'Dermatology', 'Aesthetic Medicine'],
    languages: ['Korean', 'English', 'Japanese'],
    certifications: ['Korean Board of Plastic Surgery', 'ISAPS Member'],
    bio_en: 'Dr. Kim is a board-certified plastic surgeon with over 12 years of experience in cosmetic and reconstructive procedures. Specializing in facial aesthetics and body contouring, Dr. Kim has helped thousands of international patients achieve their aesthetic goals in Korea.',
  },
  ko: {
    name: '김수현 원장',
    name_en: 'Dr. Kim Soo-hyun',
    years_of_experience: 12,
    specialties: ['성형외과', '피부과', '미용의학'],
    languages: ['한국어', '영어', '일본어'],
    certifications: ['대한성형외과학회 전문의', 'ISAPS 회원'],
    bio_en: '김수현 원장은 12년 이상의 성형 및 재건 수술 경험을 보유한 전문의입니다. 안면 성형과 체형 관리를 전문으로 하며, 수천 명의 해외 환자들이 한국에서 미용 목표를 달성하도록 도와왔습니다.',
  },
  ja: {
    name: 'キム・スヒョン院長',
    name_en: 'Dr. Kim Soo-hyun',
    years_of_experience: 12,
    specialties: ['美容整形', '皮膚科', '美容医学'],
    languages: ['韓国語', '英語', '日本語'],
    certifications: ['韓国形成外科学会専門医', 'ISAPS会員'],
    bio_en: 'キム院長は12年以上の美容整形・再建手術の経験を持つ専門医です。顔面美容とボディケアを専門とし、数千人の海外患者様が韓国で美容目標を達成するお手伝いをしてきました。',
  },
  'zh-CN': {
    name: '金秀贤院长',
    name_en: 'Dr. Kim Soo-hyun',
    years_of_experience: 12,
    specialties: ['整形外科', '皮肤科', '美容医学'],
    languages: ['韩语', '英语', '日语'],
    certifications: ['韩国整形外科学会专家', 'ISAPS会员'],
    bio_en: '金秀贤院长是一位拥有12年以上整形及重建手术经验的专家。专门从事面部美容和体型管理，已帮助数千名国际患者在韩国实现美容目标。',
  },
  'zh-TW': {
    name: '金秀賢院長',
    name_en: 'Dr. Kim Soo-hyun',
    years_of_experience: 12,
    specialties: ['整形外科', '皮膚科', '美容醫學'],
    languages: ['韓語', '英語', '日語'],
    certifications: ['韓國整形外科學會專家', 'ISAPS會員'],
    bio_en: '金秀賢院長是一位擁有12年以上整形及重建手術經驗的專家。專門從事面部美容和體型管理，已幫助數千名國際患者在韓國實現美容目標。',
  },
  th: {
    name: 'นพ.คิม ซูฮยอน',
    name_en: 'Dr. Kim Soo-hyun',
    years_of_experience: 12,
    specialties: ['ศัลยกรรมตกแต่ง', 'ผิวหนัง', 'เวชศาสตร์ความงาม'],
    languages: ['เกาหลี', 'อังกฤษ', 'ญี่ปุ่น'],
    certifications: ['แพทย์ผู้เชี่ยวชาญศัลยกรรมตกแต่งเกาหลี', 'สมาชิก ISAPS'],
    bio_en: 'นพ.คิม เป็นศัลยแพทย์ตกแต่งที่มีประสบการณ์มากกว่า 12 ปี เชี่ยวชาญด้านความงามใบหน้าและรูปร่าง ช่วยเหลือผู้ป่วยต่างชาติหลายพันคนให้บรรลุเป้าหมายความงามในเกาหลี',
  },
  ru: {
    name: 'Д-р Ким Су Хён',
    name_en: 'Dr. Kim Soo-hyun',
    years_of_experience: 12,
    specialties: ['Пластическая хирургия', 'Дерматология', 'Эстетическая медицина'],
    languages: ['Корейский', 'Английский', 'Японский'],
    certifications: ['Сертификат Корейского общества пластической хирургии', 'Член ISAPS'],
    bio_en: 'Д-р Ким - сертифицированный пластический хирург с более чем 12-летним опытом работы в области косметических и реконструктивных процедур. Специализируясь на эстетике лица и контурировании тела, д-р Ким помог тысячам иностранных пациентов достичь своих эстетических целей в Корее.',
  },
  mn: {
    name: 'Др. Ким Су Хён',
    name_en: 'Dr. Kim Soo-hyun',
    years_of_experience: 12,
    specialties: ['Гоо сайхны мэс засал', 'Арьс судлал', 'Гоо сайхны анагаах ухаан'],
    languages: ['Солонгос', 'Англи', 'Япон'],
    certifications: ['Солонгосын Гоо сайхны мэс заслын нийгэмлэгийн гишүүн', 'ISAPS гишүүн'],
    bio_en: 'Др. Ким бол 12 жилийн туршлагатай гоо сайхны болон сэргээн засах мэс заслын мэргэжилтэн юм. Нүүрний гоо сайхан болон биеийн хэлбэржилтээр мэргэшсэн тэрээр олон мянган гадаадын өвчтөнүүдэд Солонгост гоо сайхны зорилгодоо хүрэхэд тусалсан.',
  },
};

function getMockAuthor(locale: string) {
  return MOCK_AUTHORS[locale] || MOCK_AUTHORS['en'];
}

interface BlogPostData {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  cover_image_url: string | null;
  status: string;
  view_count: number;
  published_at: string | null;
  created_at: string;
  seo_meta: {
    meta_title?: string;
    meta_description?: string;
  } | null;
  generation_metadata: {
    aiSummary?: BlogPost['aiSummary'];
    faq_schema?: BlogPost['faqSchema'];
    author?: BlogPost['generatedAuthor'];
  } | null;
}

export default function PreviewPage() {
  const params = useParams();
  // Decode slug in case it's URL encoded (for non-ASCII characters like Korean, Japanese, etc.)
  const rawSlug = params.slug as string;
  const slug = decodeURIComponent(rawSlug);

  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from content API with specific slug (encode for URL safety)
      const response = await fetch(`/api/content?slug=${encodeURIComponent(slug)}`);
      const data = await response.json();

      if (data.success && data.data) {
        setPost(data.data);
      } else {
        setError('Content not found.');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load content.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!post) return;

    setPublishing(true);
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          status: 'published',
          published_at: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Published successfully!');
        fetchPost();
      } else {
        alert('Publish failed: ' + (data.error?.message || ''));
      }
    } catch (err) {
      console.error('Publish error:', err);
      alert('An error occurred while publishing.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{error || 'Content not found.'}</p>
        <Button asChild>
          <Link href="/admin/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Link>
        </Button>
      </div>
    );
  }

  // Get locale-specific mock author if no real author exists
  const postLocale = post.locale || 'en';
  const mockAuthor = getMockAuthor(postLocale);
  const generatedAuthor = post.generation_metadata?.author || mockAuthor;

  // Transform to BlogPost format for BlogPostClient
  const blogPost: BlogPost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    metaTitle: post.seo_meta?.meta_title || null,
    metaDescription: post.seo_meta?.meta_description || null,
    cover_image_url: post.cover_image_url,
    category: post.category || 'general',
    categoryDisplayName: getCategoryName(post.category, postLocale),
    tags: post.tags,
    published_at: post.published_at || new Date().toISOString(), // Use current date for preview
    view_count: post.view_count || 0,
    aiSummary: post.generation_metadata?.aiSummary,
    faqSchema: post.generation_metadata?.faq_schema,
    generatedAuthor: generatedAuthor,
    relatedPosts: [],
  };

  const publishedUrl = `/${post.locale || 'en'}/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin Header Bar */}
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/content">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                  {post.status}
                </Badge>
                <Badge variant="outline">
                  <Globe className="h-3 w-3 mr-1" />
                  {post.locale?.toUpperCase() || 'EN'}
                </Badge>
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchPost}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              {post.status === 'published' ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live
                  </a>
                </Button>
              ) : (
                <Button size="sm" onClick={handlePublish} disabled={publishing}>
                  {publishing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEO Preview Section */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">SEO Preview</h2>
            </div>

            {/* Google Search Preview */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Google Search Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-blue-600 text-xl hover:underline cursor-pointer">
                    {post.seo_meta?.meta_title || post.title}
                  </p>
                  <p className="text-green-700 text-sm">
                    getcarekorea.com &rsaquo; {post.locale} &rsaquo; blog &rsaquo; {post.slug?.slice(0, 30)}...
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {post.seo_meta?.meta_description || post.excerpt || 'No description available.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* OG Preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Social Media Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden max-w-md">
                  {post.cover_image_url && (
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={post.cover_image_url}
                        alt="OG Image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3 bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase">getcarekorea.com</p>
                    <p className="font-semibold text-sm line-clamp-2">
                      {post.seo_meta?.meta_title || post.title}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {post.seo_meta?.meta_description || post.excerpt}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meta Info */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{post.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tags</p>
                  <p className="font-medium">{post.tags?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Published URL</p>
                  <code className="text-xs bg-background px-2 py-1 rounded">{publishedUrl}</code>
                </div>
                <div>
                  <p className="text-muted-foreground">Views</p>
                  <p className="font-medium">{post.view_count?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Banner */}
      <div className="bg-yellow-100 dark:bg-yellow-900/30 py-2 text-center">
        <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
          <Eye className="h-4 w-4 inline-block mr-2" />
          Preview Mode - This is how the blog post will appear to visitors
        </span>
      </div>

      {/* Actual Blog Post Client UI */}
      <BlogPostClient initialPost={blogPost} slug={post.slug} />
    </div>
  );
}
