'use client';

/**
 * Content Preview Page
 *
 * Preview content as it would appear on the actual blog
 * Supports Desktop and Mobile view modes
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Monitor, Smartphone, X, RotateCcw } from 'lucide-react';

interface AuthorInfo {
  name: string;
  name_local?: string;
  photo_url?: string;
  bio?: string;
  specialties?: string[];
  years_of_experience?: number;
}

interface Draft {
  id: string;
  locale: string;
  status: string;
  category: string;
  created_at: string;
  author_name?: string;
  author?: AuthorInfo;
  title: string;
  excerpt?: string;
  content: string;
  author_bio?: string;
  faq_schema?: Array<{ question: string; answer: string }>;
  tags?: string[];
}

type ViewMode = 'desktop' | 'mobile';

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  useEffect(() => {
    async function fetchDraft() {
      try {
        // Try blog_posts first, then content_drafts
        let response = await fetch(`/api/blog/${id}`);
        if (!response.ok) {
          response = await fetch(`/api/content/drafts/${id}`);
        }
        if (!response.ok) {
          throw new Error('Draft not found');
        }
        const data = await response.json();

        // Handle different response formats
        const post = data.post || data.data || data;

        // Map blog_posts format to Draft interface
        if (post.title_en || post.content_en) {
          const metadata = post.generation_metadata || {};
          const locale = metadata.locale || 'en';
          const localeKey = locale.replace('-', '_');

          // Extract author info from various sources
          let authorInfo: AuthorInfo | undefined;

          // Priority: 1. author_persona (DB), 2. generation_metadata.author, 3. authorPersona (API response)
          if (post.author_persona) {
            authorInfo = {
              name: post.author_persona.name_en,
              name_local: post.author_persona[`name_${localeKey}`] || post.author_persona.name_en,
              photo_url: post.author_persona.photo_url,
              bio: post.author_persona[`bio_${localeKey}`] || post.author_persona.bio_en,
              specialties: post.author_persona.specialties,
              years_of_experience: post.author_persona.years_of_experience,
            };
          } else if (metadata.author) {
            authorInfo = {
              name: metadata.author.name_en || metadata.author.name,
              name_local: metadata.author.name_local || metadata.author.name_en,
              photo_url: metadata.author.photo_url,
              bio: metadata.author.bio,
              specialties: metadata.author.specialties,
              years_of_experience: metadata.author.years_of_experience,
            };
          } else if (data.authorPersona) {
            authorInfo = {
              name: data.authorPersona.name_en,
              name_local: data.authorPersona[`name_${localeKey}`] || data.authorPersona.name_en,
              photo_url: data.authorPersona.photo_url,
              bio: data.authorPersona[`bio_${localeKey}`] || data.authorPersona.bio_en,
              specialties: data.authorPersona.specialties,
              years_of_experience: data.authorPersona.years_of_experience,
            };
          } else if (data.generatedAuthor) {
            authorInfo = {
              name: data.generatedAuthor.name_en || data.generatedAuthor.name,
              name_local: data.generatedAuthor.name_local,
              bio: data.generatedAuthor.bio,
              specialties: data.generatedAuthor.specialties,
              years_of_experience: data.generatedAuthor.years_of_experience,
            };
          }

          setDraft({
            id: post.id,
            locale: locale,
            status: post.status || 'draft',
            category: post.category || 'general',
            created_at: post.created_at,
            author_name: authorInfo?.name_local || authorInfo?.name,
            author: authorInfo,
            title: post[`title_${localeKey}`] || post.title_en || post.title,
            excerpt: post[`excerpt_${localeKey}`] || post.excerpt_en || post.excerpt,
            content: post[`content_${localeKey}`] || post.content_en || post.content,
            author_bio: authorInfo?.bio || metadata.author?.bio || post.author_persona?.bio_en,
            faq_schema: metadata.faqSchema,
            tags: post.tags,
          });
        } else {
          // content_drafts format - also extract author if available
          const authorData = post.author || post.author_persona;
          setDraft({
            ...post,
            author: authorData ? {
              name: authorData.name_en || authorData.name,
              name_local: authorData.name_local,
              photo_url: authorData.photo_url,
              bio: authorData.bio || authorData.bio_en,
              specialties: authorData.specialties,
              years_of_experience: authorData.years_of_experience,
            } : undefined,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load draft');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDraft();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Preview Not Found</h1>
          <p className="text-gray-600">{error || 'The content preview could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  // Desktop view width
  const desktopWidth = 'max-w-5xl'; // 1024px
  // Mobile view width (iPhone-like)
  const mobileWidth = 'w-[375px]';

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Fixed Preview Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Info */}
            <div className="flex items-center gap-4">
              <span className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                미리보기
              </span>
              <span className="text-gray-300 text-sm hidden sm:inline">
                {draft.locale.toUpperCase()} | {draft.category} | {draft.status}
              </span>
            </div>

            {/* Center: View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="text-gray-400 hover:text-white p-2 rounded-md transition-colors"
                title="새로고침"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.close()}
                className="text-gray-400 hover:text-white p-2 rounded-md transition-colors"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content Area */}
      <div className="pt-20 pb-12 px-4 flex justify-center">
        {/* Preview Frame */}
        <div
          className={`transition-all duration-300 ${
            viewMode === 'mobile' ? mobileWidth : desktopWidth + ' w-full'
          }`}
        >
          {/* Mobile Frame */}
          {viewMode === 'mobile' && (
            <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
              {/* Phone notch */}
              <div className="bg-gray-900 h-6 flex justify-center items-center mb-1">
                <div className="w-20 h-5 bg-black rounded-full"></div>
              </div>
              {/* Phone screen */}
              <div className="bg-white rounded-[2rem] overflow-hidden" style={{ height: '80vh' }}>
                <div className="h-full overflow-y-auto">
                  <PreviewContent draft={draft} isMobile={true} />
                </div>
              </div>
              {/* Phone bottom bar */}
              <div className="bg-gray-900 h-5 flex justify-center items-center mt-1">
                <div className="w-24 h-1 bg-gray-700 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Desktop Frame */}
          {viewMode === 'desktop' && (
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-100 border-b px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-4 py-1.5 text-sm text-gray-500 border">
                    getcarekorea.com/blog/{draft.id}
                  </div>
                </div>
              </div>
              {/* Desktop content */}
              <div className="max-h-[85vh] overflow-y-auto">
                <PreviewContent draft={draft} isMobile={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component for preview content
function PreviewContent({ draft, isMobile }: { draft: Draft; isMobile: boolean }) {
  return (
    <article className={`${isMobile ? 'px-4 py-6' : 'px-8 lg:px-16 py-12'}`}>
      {/* Author Header Card */}
      {draft.author && (
        <div className={`mb-6 p-4 bg-gray-50 rounded-xl ${isMobile ? '' : 'flex items-center gap-4'}`}>
          {/* Author Photo */}
          <div className={`flex-shrink-0 ${isMobile ? 'flex items-center gap-3 mb-3' : ''}`}>
            {draft.author.photo_url ? (
              <img
                src={draft.author.photo_url}
                alt={draft.author.name}
                className={`rounded-full object-cover ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
              />
            ) : (
              <div className={`rounded-full bg-violet-500 flex items-center justify-center text-white font-semibold ${isMobile ? 'w-12 h-12 text-lg' : 'w-16 h-16 text-xl'}`}>
                {(draft.author.name_local || draft.author.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            {isMobile && (
              <div>
                <p className="font-semibold text-gray-900">{draft.author.name_local || draft.author.name}</p>
                {draft.author.specialties && draft.author.specialties.length > 0 && (
                  <p className="text-xs text-gray-500">{draft.author.specialties.slice(0, 2).join(' • ')}</p>
                )}
              </div>
            )}
          </div>
          {/* Author Info */}
          {!isMobile && (
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">{draft.author.name_local || draft.author.name}</p>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                {draft.author.years_of_experience && (
                  <span>{draft.author.years_of_experience}년 경력</span>
                )}
                {draft.author.specialties && draft.author.specialties.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{draft.author.specialties.slice(0, 3).join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meta Info */}
      <div className={`mb-4 flex flex-wrap items-center gap-2 text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
        <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-xs font-medium">
          {draft.category}
        </span>
        <span>•</span>
        <span>
          {new Date(draft.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        {!draft.author && draft.author_name && (
          <>
            <span>•</span>
            <span>{draft.author_name}</span>
          </>
        )}
      </div>

      {/* Title */}
      <h1 className={`font-bold mb-4 text-gray-900 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
        {draft.title}
      </h1>

      {/* Excerpt */}
      {draft.excerpt && (
        <p className={`text-gray-600 mb-8 ${isMobile ? 'text-base' : 'text-xl'}`}>
          {draft.excerpt}
        </p>
      )}

      {/* Content (HTML) with CTA Button Styles */}
      <div
        className={`prose max-w-none ${isMobile ? 'prose-sm' : 'prose-lg'} preview-content`}
        dangerouslySetInnerHTML={{ __html: draft.content }}
        style={{
          '--tw-prose-body': '#374151',
          '--tw-prose-headings': '#111827',
          '--tw-prose-links': '#2563eb',
        } as React.CSSProperties}
      />

      {/* CTA Button Styles */}
      <style jsx global>{`
        /* CTA Button Base Styles */
        .preview-content a[href*="/contact"],
        .preview-content a[href*="messenger="] {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: ${isMobile ? '0.75rem 1.5rem' : '1rem 2rem'};
          font-size: ${isMobile ? '0.95rem' : '1.1rem'};
          font-weight: 600;
          border-radius: 0.75rem;
          text-decoration: none !important;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          margin: 1.5rem 0;
          width: ${isMobile ? '100%' : 'auto'};
          min-width: ${isMobile ? 'auto' : '280px'};
        }

        /* KakaoTalk - Yellow */
        .preview-content a[href*="messenger=kakao"] {
          background: linear-gradient(135deg, #FEE500 0%, #F5D800 100%);
          color: #3C1E1E !important;
        }
        .preview-content a[href*="messenger=kakao"]:hover {
          background: linear-gradient(135deg, #F5D800 0%, #E6C800 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(254, 229, 0, 0.4);
        }
        .preview-content a[href*="messenger=kakao"]::before {
          content: "💬";
          font-size: 1.2em;
        }

        /* WhatsApp - Green */
        .preview-content a[href*="messenger=whatsapp"] {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white !important;
        }
        .preview-content a[href*="messenger=whatsapp"]:hover {
          background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
        }
        .preview-content a[href*="messenger=whatsapp"]::before {
          content: "📱";
          font-size: 1.2em;
        }

        /* LINE - Green */
        .preview-content a[href*="messenger=line"] {
          background: linear-gradient(135deg, #00B900 0%, #00A000 100%);
          color: white !important;
        }
        .preview-content a[href*="messenger=line"]:hover {
          background: linear-gradient(135deg, #00A000 0%, #008F00 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 185, 0, 0.4);
        }
        .preview-content a[href*="messenger=line"]::before {
          content: "💚";
          font-size: 1.2em;
        }

        /* WeChat - Green */
        .preview-content a[href*="messenger=wechat"] {
          background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
          color: white !important;
        }
        .preview-content a[href*="messenger=wechat"]:hover {
          background: linear-gradient(135deg, #06AD56 0%, #059A4A 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(7, 193, 96, 0.4);
        }
        .preview-content a[href*="messenger=wechat"]::before {
          content: "💬";
          font-size: 1.2em;
        }

        /* Zalo - Blue */
        .preview-content a[href*="messenger=zalo"] {
          background: linear-gradient(135deg, #0068FF 0%, #0054D1 100%);
          color: white !important;
        }
        .preview-content a[href*="messenger=zalo"]:hover {
          background: linear-gradient(135deg, #0054D1 0%, #0042A8 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 104, 255, 0.4);
        }
        .preview-content a[href*="messenger=zalo"]::before {
          content: "📲";
          font-size: 1.2em;
        }

        /* Email - Purple */
        .preview-content a[href*="messenger=email"] {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          color: white !important;
        }
        .preview-content a[href*="messenger=email"]:hover {
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }
        .preview-content a[href*="messenger=email"]::before {
          content: "✉️";
          font-size: 1.2em;
        }

        /* Default CTA - Violet */
        .preview-content a[href*="/contact"]:not([href*="messenger="]) {
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
          color: white !important;
        }
        .preview-content a[href*="/contact"]:not([href*="messenger="]):hover {
          background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }
        .preview-content a[href*="/contact"]:not([href*="messenger="])::before {
          content: "📞";
          font-size: 1.2em;
        }

        /* Image styles */
        .preview-content img {
          border-radius: 0.75rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
        }

        /* Table styles */
        .preview-content table {
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .preview-content th {
          background: #F3F4F6;
        }
      `}</style>

      {/* Author Bio Card */}
      {(draft.author || draft.author_bio) && (
        <div className={`mt-10 pt-8 border-t ${isMobile ? '' : ''}`}>
          <h3 className={`font-semibold mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>
            About the Author
          </h3>
          <div className={`bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-5 ${isMobile ? '' : 'flex gap-5'}`}>
            {/* Author Photo */}
            {draft.author && (
              <div className={`flex-shrink-0 ${isMobile ? 'flex items-center gap-4 mb-4' : ''}`}>
                {draft.author.photo_url ? (
                  <img
                    src={draft.author.photo_url}
                    alt={draft.author.name}
                    className={`rounded-full object-cover border-4 border-white shadow-md ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
                  />
                ) : (
                  <div className={`rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold border-4 border-white shadow-md ${isMobile ? 'w-16 h-16 text-xl' : 'w-20 h-20 text-2xl'}`}>
                    {(draft.author.name_local || draft.author.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                {isMobile && (
                  <div>
                    <p className="font-bold text-gray-900">{draft.author.name_local || draft.author.name}</p>
                    {draft.author.years_of_experience && (
                      <p className="text-sm text-violet-600 font-medium">{draft.author.years_of_experience}년 경력 의료 통역사</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Author Details */}
            <div className="flex-1">
              {!isMobile && draft.author && (
                <div className="mb-3">
                  <p className="font-bold text-gray-900 text-lg">{draft.author.name_local || draft.author.name}</p>
                  {draft.author.years_of_experience && (
                    <p className="text-sm text-violet-600 font-medium">{draft.author.years_of_experience}년 경력 의료 통역사</p>
                  )}
                </div>
              )}
              {/* Specialties */}
              {draft.author?.specialties && draft.author.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {draft.author.specialties.map((specialty, idx) => (
                    <span key={idx} className="bg-white text-violet-700 text-xs px-2 py-1 rounded-full border border-violet-200">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              {/* Bio */}
              {(draft.author?.bio || draft.author_bio) && (
                <p className={`text-gray-600 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
                  {draft.author?.bio || draft.author_bio}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Schema */}
      {draft.faq_schema && Array.isArray(draft.faq_schema) && draft.faq_schema.length > 0 && (
        <div className={`mt-10 pt-8 border-t ${isMobile ? 'text-sm' : ''}`}>
          <h3 className={`font-bold mb-6 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            Frequently Asked Questions
          </h3>
          <div className="space-y-5">
            {draft.faq_schema.map((faq, index) => (
              <div key={index} className="border-l-4 border-violet-500 pl-4">
                <h4 className={`font-semibold mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
                  {faq.question}
                </h4>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {draft.tags && Array.isArray(draft.tags) && draft.tags.length > 0 && (
        <div className={`mt-10 pt-8 border-t ${isMobile ? 'text-sm' : ''}`}>
          <h3 className={`font-semibold mb-3 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {draft.tags.map((tag, index) => (
              <span
                key={index}
                className={`bg-gray-100 text-gray-700 rounded-full ${
                  isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
