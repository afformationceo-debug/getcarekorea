/**
 * Blog Post Detail API
 *
 * GET /api/blog/[slug] - Get blog post by slug
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
} from '@/lib/api/error-handler';
import type { BlogPost } from '@/types/database';

// Cache blog posts for 60 seconds
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

// Map locale to database field suffix
const localeFieldMap: Record<string, string> = {
  en: 'en',
  'zh-TW': 'zh_tw',
  'zh-CN': 'zh_cn',
  ja: 'ja',
  th: 'th',
  mn: 'mn',
  ru: 'ru',
};

// Transform blog post to include localized fields
function transformBlogPost(post: BlogPost, locale: string) {
  const suffix = localeFieldMap[locale] || 'en';
  const titleKey = `title_${suffix}` as keyof BlogPost;
  const excerptKey = `excerpt_${suffix}` as keyof BlogPost;
  const contentKey = `content_${suffix}` as keyof BlogPost;
  const metaTitleKey = `meta_title_${suffix}` as keyof BlogPost;
  const metaDescKey = `meta_description_${suffix}` as keyof BlogPost;

  return {
    ...post,
    title: (post[titleKey] as string) || post.title_en,
    excerpt: (post[excerptKey] as string | null) || post.excerpt_en,
    content: (post[contentKey] as string | null) || post.content_en,
    metaTitle: (post[metaTitleKey] as string | null) || post.meta_title_en,
    metaDescription: (post[metaDescKey] as string | null) || post.meta_description_en,
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const locale = searchParams.get('locale') || 'en';
    const includeRelated = searchParams.get('includeRelated') !== 'false';

    const startTime = Date.now();

    // Get blog post
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: postData, error } = await (supabase.from('blog_posts') as any)
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    const post = postData as BlogPost | null;

    if (error || !post) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Blog post not found', { slug }, locale);
    }

    // Increment view count (fire and forget)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('blog_posts') as any)
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id)
      .then(() => {
        // View count updated
      });

    // Build response
    const response: Record<string, unknown> = transformBlogPost(post, locale);

    // Fetch related posts if requested
    if (includeRelated && post.category) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: related } = await (supabase.from('blog_posts') as any)
        .select('id, slug, title_en, cover_image_url, published_at')
        .eq('status', 'published')
        .eq('category', post.category)
        .neq('id', post.id)
        .order('published_at', { ascending: false })
        .limit(3);

      response.relatedPosts = (related || []).map((p: { id: string; slug: string; title_en: string; cover_image_url: string | null; published_at: string | null }) => ({
        ...p,
        title: p.title_en,
      }));
    }

    // Fetch author info if available (prefer author_persona over legacy author_id)
    if (post.author_persona_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: authorPersona } = await (supabase.from('author_personas') as any)
        .select('*')
        .eq('id', post.author_persona_id)
        .single();

      if (authorPersona) {
        response.authorPersona = authorPersona;
        // Also set legacy author for backward compatibility
        response.author = {
          id: authorPersona.id,
          full_name: authorPersona.name_en,
          avatar_url: authorPersona.photo_url,
        };
      }
    } else if (post.author_id) {
      // Fallback to legacy author_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: author } = await (supabase.from('profiles') as any)
        .select('id, full_name, avatar_url')
        .eq('id', post.author_id)
        .single();

      response.author = author;
    }

    // Also check generation_metadata for author info (for AI-generated content)
    if (!response.authorPersona && post.generation_metadata) {
      const metadata = typeof post.generation_metadata === 'string'
        ? JSON.parse(post.generation_metadata)
        : post.generation_metadata;

      if (metadata.author) {
        response.generatedAuthor = metadata.author;
      }
    }

    const responseTime = Date.now() - startTime;
    secureLog('info', 'Blog post fetched', {
      slug,
      responseTimeMs: responseTime,
      viewCount: post.view_count,
    });

    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}
