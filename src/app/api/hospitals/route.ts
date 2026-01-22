/**
 * Hospitals API
 *
 * GET /api/hospitals - List hospitals with filtering and pagination
 * POST /api/hospitals - Create a new hospital (admin only)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
} from '@/lib/api/error-handler';
import type { Hospital } from '@/types/database';

// Supported locales for multi-language fields
const SUPPORTED_LOCALES = ['en', 'zh-TW', 'zh-CN', 'ja', 'th', 'mn', 'ru'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

// Map locale to database field suffix
const localeFieldMap: Record<Locale, string> = {
  en: 'en',
  'zh-TW': 'zh_tw',
  'zh-CN': 'zh_cn',
  ja: 'ja',
  th: 'th',
  mn: 'mn',
  ru: 'ru',
};

// Get name and description fields based on locale
function getLocalizedFields(locale: Locale): string {
  const suffix = localeFieldMap[locale] || 'en';
  return `name_${suffix}, description_${suffix}`;
}

// Transform hospital data to include localized fields
function transformHospital(hospital: Hospital, locale: Locale): Hospital & { name: string; description: string | null } {
  const suffix = localeFieldMap[locale] || 'en';
  const nameKey = `name_${suffix}` as keyof Hospital;
  const descKey = `description_${suffix}` as keyof Hospital;

  return {
    ...hospital,
    name: (hospital[nameKey] as string) || hospital.name_en,
    description: (hospital[descKey] as string | null) || hospital.description_en,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const locale = (searchParams.get('locale') || 'en') as Locale;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    // Filter parameters
    const city = searchParams.get('city');
    const specialty = searchParams.get('specialty');
    const language = searchParams.get('language');
    const minRating = searchParams.get('minRating');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'avg_rating';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = supabase
      .from('hospitals')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    // Apply filters
    if (city) {
      query = query.eq('city', city);
    }

    if (specialty) {
      query = query.contains('specialties', [specialty]);
    }

    if (language) {
      query = query.contains('languages', [language]);
    }

    if (minRating) {
      query = query.gte('avg_rating', parseFloat(minRating));
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Text search
    if (search) {
      const searchPattern = `%${search}%`;
      query = query.or(`name_en.ilike.${searchPattern},description_en.ilike.${searchPattern}`);
    }

    // Apply sorting
    const validSortFields = ['avg_rating', 'review_count', 'name_en', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'avg_rating';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const startTime = Date.now();
    const { data, error, count } = await query;
    const responseTime = Date.now() - startTime;

    // Log performance metrics
    secureLog('info', 'Hospitals query executed', {
      responseTimeMs: responseTime,
      recordCount: data?.length || 0,
      totalCount: count || 0,
      filters: { city, specialty, language, minRating, featured, search },
    });

    if (error) {
      secureLog('error', 'Database error fetching hospitals', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, { dbError: error.message }, locale);
    }

    // Transform data with locale-specific fields
    const hospitals = (data || []).map(hospital => transformHospital(hospital, locale));

    return createSuccessResponse(hospitals, {
      page,
      limit,
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Check user role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    if (!['admin', 'hospital_admin'].includes(profile.role)) {
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['slug', 'name_en'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        undefined,
        { missingFields }
      );
    }

    // Check for duplicate slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('hospitals') as any)
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'A hospital with this slug already exists',
        { field: 'slug' }
      );
    }

    // Create hospital
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: hospital, error: insertError } = await (supabase.from('hospitals') as any)
      .insert({
        ...body,
        admin_id: profile.role === 'hospital_admin' ? user.id : body.admin_id,
        status: profile.role === 'admin' ? body.status || 'draft' : 'draft',
      })
      .select()
      .single();

    if (insertError) {
      secureLog('error', 'Error creating hospital', { error: insertError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR);
    }

    secureLog('info', 'Hospital created', {
      hospitalId: hospital.id,
      slug: hospital.slug,
      createdBy: user.id,
    });

    return createSuccessResponse(hospital);
  } catch (error) {
    return createErrorResponse(error);
  }
}
