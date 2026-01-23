'use client';

/**
 * Content Preview Page
 *
 * Preview content as it would appear on the actual blog
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

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

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDraft() {
      try {
        const response = await fetch(`/api/content/drafts/${id}`);
        if (!response.ok) {
          throw new Error('Draft not found');
        }
        const data = await response.json();
        setDraft(data.data || data);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Preview Not Found</h1>
          <p className="text-gray-600">{error || 'The content preview could not be loaded.'}</p>
        </div>
      </div>
    );
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

    </div>
  );
}
