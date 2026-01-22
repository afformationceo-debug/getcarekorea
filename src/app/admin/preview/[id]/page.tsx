/**
 * Content Preview Page
 *
 * Preview content as it would appear on the actual blog
 */

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Fetch content draft
  const { data: draft, error } = await supabase
    .from('content_drafts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !draft) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Header */}
      <div className="bg-yellow-100 border-b border-yellow-200 py-3">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-yellow-800 font-medium">미리보기 모드</span>
              <span className="text-sm text-yellow-700">
                {draft.locale.toUpperCase()} | {draft.status}
              </span>
            </div>
            <button
              onClick={() => window.close()}
              className="text-yellow-800 hover:text-yellow-900 text-sm font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* Blog Post Preview */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Meta Info */}
        <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
          <span>{draft.category}</span>
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
              <span>작성자: {draft.author_name}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-4">{draft.title}</h1>

        {/* Excerpt */}
        {draft.excerpt && (
          <p className="text-xl text-gray-600 mb-8">{draft.excerpt}</p>
        )}

        {/* Content (HTML) */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: draft.content }}
          style={{
            // Custom styles for HTML content
            '--tw-prose-body': '#374151',
            '--tw-prose-headings': '#111827',
            '--tw-prose-links': '#2563eb',
          } as any}
        />

        {/* Author Bio */}
        {draft.author_bio && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-2">작성자 정보</h3>
            <p className="text-gray-600">{draft.author_bio}</p>
          </div>
        )}

        {/* FAQ Schema (if exists) */}
        {draft.faq_schema && Array.isArray(draft.faq_schema) && draft.faq_schema.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-2xl font-bold mb-6">자주 묻는 질문</h3>
            <div className="space-y-6">
              {draft.faq_schema.map((faq: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-lg mb-2">
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
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-3">태그</h3>
            <div className="flex flex-wrap gap-2">
              {draft.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      <style jsx global>{`
        /* Prose styles for HTML content */
        .prose {
          color: #374151;
        }

        .prose h2 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }

        .prose h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }

        .prose p {
          margin-bottom: 1.25rem;
          line-height: 1.75;
        }

        .prose ul, .prose ol {
          margin: 1.5rem 0;
          padding-left: 2rem;
        }

        .prose li {
          margin-bottom: 0.5rem;
        }

        .prose table {
          width: 100%;
          margin: 2rem 0;
          border-collapse: collapse;
        }

        .prose th {
          background: #f3f4f6;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          border: 1px solid #e5e7eb;
        }

        .prose td {
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
        }

        .prose img {
          margin: 2rem 0;
          border-radius: 0.5rem;
          max-width: 100%;
          height: auto;
        }

        .prose .quick-answer {
          background: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 1.5rem;
          margin: 2rem 0;
          border-radius: 0.5rem;
        }

        .prose .expert-tip {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 1.5rem;
          margin: 2rem 0;
          border-radius: 0.5rem;
        }

        .prose .faq-section {
          margin: 3rem 0;
        }

        .prose .faq-item {
          margin: 1.5rem 0;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .prose .faq-question {
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .prose .author-bio {
          background: #f3f4f6;
          padding: 2rem;
          border-radius: 0.5rem;
          margin: 3rem 0;
        }
      `}</style>
    </div>
  );
}
