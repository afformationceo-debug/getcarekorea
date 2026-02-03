/**
 * Procedure Detail API
 *
 * GET /api/procedures/[slug] - Get procedure by slug
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
} from '@/lib/api/error-handler';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: proc, error } = await (supabase.from('procedures') as any)
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !proc) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Procedure not found');
    }

    // Get related hospitals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: hospitalLinks } = await (supabase.from('hospital_procedures') as any)
      .select(`
        hospital_id,
        price_range,
        is_featured,
        hospitals (
          id,
          slug,
          name_en,
          name,
          cover_image_url,
          city,
          avg_rating,
          review_count,
          certifications
        )
      `)
      .eq('procedure_id', proc.id);

    // Helper to get localized value from JSONB field
    const getLocalizedValue = (jsonField: Record<string, string> | null | undefined, fallbackLocale = 'en'): string => {
      if (!jsonField) return '';
      return jsonField[locale] || jsonField[fallbackLocale] || jsonField['en'] || '';
    };

    const hospitals = (hospitalLinks || [])
      .filter((link: Record<string, unknown>) => link.hospitals)
      .map((link: Record<string, unknown>) => {
        const h = link.hospitals as Record<string, unknown>;
        const nameJson = h.name as Record<string, string> | null;
        return {
          id: h.id,
          slug: h.slug,
          name: getLocalizedValue(nameJson) || (h.name_en as string),
          cover_image_url: h.cover_image_url,
          city: h.city,
          avg_rating: h.avg_rating,
          review_count: h.review_count,
          certifications: h.certifications,
          price_range: link.price_range,
          is_featured: link.is_featured,
        };
      });

    const procedure = {
      id: proc.id,
      slug: proc.slug,
      category: proc.category,
      name: proc[`name_${locale}`] || proc.name_en,
      description: proc[`description_${locale}`] || proc.description_en,
      short_description: proc[`short_description_${locale}`] || proc.short_description_en,
      image_url: proc.image_url,
      price_range_usd: proc.price_range_usd,
      duration_minutes: proc.duration_minutes,
      recovery_days: proc.recovery_days,
      popularity_score: proc.popularity_score,
      is_featured: proc.is_featured,
      faq: proc[`faq_${locale}`] || proc.faq_en,
      hospitals,
    };

    return createSuccessResponse({ procedure });
  } catch (error) {
    return createErrorResponse(error);
  }
}
