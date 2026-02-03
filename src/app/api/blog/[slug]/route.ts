/**
 * Blog Post Detail API
 *
 * GET /api/blog/[slug] - Get blog post by slug
 *
 * Optimized response: only fields used by frontend
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
import { getCategoryName, getLanguageName } from '@/lib/i18n/translations';

// Cache blog posts for 60 seconds
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const locale = searchParams.get('locale') || 'en';
    const includeRelated = searchParams.get('includeRelated') !== 'false';

    const startTime = Date.now();

    // Get blog post - only select fields we need
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('blog_posts') as any)
      .select(`
        id, slug, locale, title, excerpt, content,
        category, tags, cover_image_url,
        published_at, view_count, author_persona_id,
        seo_meta, generation_metadata
      `)
      .eq('slug', slug)
      .eq('locale', locale)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Blog post not found', { slug }, locale);
    }

    // Increment view count (fire and forget)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('blog_posts') as any)
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id)
      .then(() => {});

    // Parse generation_metadata
    const metadata = post.generation_metadata
      ? (typeof post.generation_metadata === 'string'
          ? JSON.parse(post.generation_metadata)
          : post.generation_metadata)
      : null;

    // Build minimal response - only what frontend needs
    const response: Record<string, unknown> = {
      // Core post data
      id: post.id,
      slug: post.slug,
      locale: post.locale,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      categoryDisplayName: getCategoryName(post.category, locale),
      tags: post.tags,
      cover_image_url: post.cover_image_url,
      published_at: post.published_at,
      view_count: post.view_count,
      // SEO (extracted from JSONB)
      metaTitle: post.seo_meta?.meta_title || post.title,
      metaDescription: post.seo_meta?.meta_description || post.excerpt,
      // AI-generated data (extracted from generation_metadata)
      aiSummary: metadata?.aiSummary || null,
      faqSchema: metadata?.faqSchema || null,
    };

    // Fetch related posts if requested
    if (includeRelated && post.category) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: related } = await (supabase.from('blog_posts') as any)
        .select('id, slug, title, cover_image_url, published_at')
        .eq('status', 'published')
        .eq('category', post.category)
        .eq('locale', post.locale)
        .neq('id', post.id)
        .order('published_at', { ascending: false })
        .limit(3);

      response.relatedPosts = related || [];
    }

    // Fetch author persona - only needed fields
    if (post.author_persona_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: persona } = await (supabase.from('author_personas') as any)
        .select(`
          id, slug, photo_url, years_of_experience,
          primary_specialty, secondary_specialties, languages,
          is_verified, certifications, name, bio_short
        `)
        .eq('id', post.author_persona_id)
        .single();

      if (persona) {
        // Convert language codes to localized display names
        const languages = Array.isArray(persona.languages)
          ? persona.languages.map((lang: { code: string; proficiency: string }) => ({
              code: lang.code,
              displayName: getLanguageName(lang.code, locale),
              proficiency: lang.proficiency,
            }))
          : [];

        // Convert specialty codes to localized display names
        const secondarySpecialties = Array.isArray(persona.secondary_specialties)
          ? persona.secondary_specialties.map((spec: string) => ({
              code: spec,
              displayName: getCategoryName(spec, locale),
            }))
          : [];

        response.authorPersona = {
          id: persona.id,
          slug: persona.slug,
          photo_url: persona.photo_url,
          years_of_experience: persona.years_of_experience,
          primary_specialty: persona.primary_specialty,
          primarySpecialtyDisplayName: getCategoryName(persona.primary_specialty, locale),
          secondary_specialties: secondarySpecialties,
          languages,
          is_verified: persona.is_verified,
          certifications: persona.certifications,
          name: persona.name,
          bio_short: persona.bio_short,
        };
      }
    }

    // Fallback: generated author from metadata (for posts without author_persona)
    if (!response.authorPersona && metadata?.author) {
      response.generatedAuthor = metadata.author;
    }

    const responseTime = Date.now() - startTime;
    secureLog('info', 'Blog post fetched', {
      slug,
      locale: post.locale,
      responseTimeMs: responseTime,
    });

    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}
