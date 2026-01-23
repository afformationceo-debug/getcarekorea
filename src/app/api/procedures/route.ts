/**
 * Procedures API
 *
 * GET /api/procedures - List all procedures
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
} from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const locale = searchParams.get('locale') || 'en';
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('procedures') as any)
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    query = query
      .order('display_order', { ascending: true })
      .order('popularity_score', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching procedures:', error);
      throw new APIError(ErrorCode.DATABASE_ERROR);
    }

    // Map to locale-specific content
    const procedures = (data || []).map((proc: Record<string, unknown>) => ({
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
    }));

    return createSuccessResponse({ procedures });
  } catch (error) {
    return createErrorResponse(error);
  }
}
