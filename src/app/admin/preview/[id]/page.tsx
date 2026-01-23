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

interface Draft {
  id: string;
  locale: string;
  status: string;
  category: string;
  created_at: string;
  author_name?: string;
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

          setDraft({
            id: post.id,
            locale: locale,
            status: post.status || 'draft',
            category: post.category || 'general',
            created_at: post.created_at,
            author_name: metadata.author?.name_en || post.author_persona?.name_en,
            title: post[`title_${localeKey}`] || post.title_en || post.title,
            excerpt: post[`excerpt_${localeKey}`] || post.excerpt_en || post.excerpt,
            content: post[`content_${localeKey}`] || post.content_en || post.content,
            author_bio: metadata.author?.bio || post.author_persona?.bio_en,
            faq_schema: metadata.faqSchema,
            tags: post.tags,
          });
        } else {
          setDraft(post);
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
        {draft.author_name && (
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

      {/* Content (HTML) */}
      <div
        className={`prose max-w-none ${isMobile ? 'prose-sm' : 'prose-lg'}`}
        dangerouslySetInnerHTML={{ __html: draft.content }}
        style={{
          '--tw-prose-body': '#374151',
          '--tw-prose-headings': '#111827',
          '--tw-prose-links': '#2563eb',
        } as React.CSSProperties}
      />

      {/* Author Bio */}
      {draft.author_bio && (
        <div className={`mt-10 pt-8 border-t ${isMobile ? 'text-sm' : ''}`}>
          <h3 className={`font-semibold mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
            About the Author
          </h3>
          <p className="text-gray-600">{draft.author_bio}</p>
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
