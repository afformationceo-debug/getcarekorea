/**
 * Interpreters API
 *
 * GET /api/interpreters - List interpreters with filtering and pagination
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const locale = searchParams.get('locale') || 'en';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    // Filter parameters
    const language = searchParams.get('language');
    const specialty = searchParams.get('specialty');
    const minRating = searchParams.get('minRating');
    const maxRate = searchParams.get('maxRate');
    const available = searchParams.get('available');

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'avg_rating';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query - join with profiles for full_name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('interpreters') as any)
      .select(`
        *,
        profiles!interpreters_profile_id_fkey (
          full_name,
          avatar_url,
          email
        )
      `, { count: 'exact' });

    // Apply filters
    if (available !== 'false') {
      query = query.eq('is_available', true);
    }

    if (specialty) {
      query = query.contains('specialties', [specialty]);
    }

    if (language) {
      // Search in JSONB languages field
      query = query.contains('languages', [{ language }]);
    }

    if (minRating) {
      query = query.gte('avg_rating', parseFloat(minRating));
    }

    if (maxRate) {
      query = query.lte('hourly_rate', parseInt(maxRate, 10));
    }

    // Apply sorting
    const validSortFields = ['avg_rating', 'hourly_rate', 'total_bookings', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'avg_rating';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const startTime = Date.now();
    const { data, error, count } = await query;
    const responseTime = Date.now() - startTime;

    secureLog('info', 'Interpreters query executed', {
      responseTimeMs: responseTime,
      recordCount: data?.length || 0,
      totalCount: count || 0,
    });

    if (error) {
      secureLog('error', 'Database error fetching interpreters', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    // Transform data to include localized bio
    interface InterpreterWithProfile {
      bio_en: string | null;
      photo_url: string | null;
      profiles?: { full_name: string; avatar_url: string | null; email: string };
      [key: string]: unknown;
    }

    const interpreters = ((data || []) as InterpreterWithProfile[]).map(interpreter => {
      const bioKey = `bio_${locale.replace('-', '_').toLowerCase()}`;
      return {
        ...interpreter,
        bio: (interpreter[bioKey] as string) || interpreter.bio_en,
        // Flatten profile data
        full_name: interpreter.profiles?.full_name,
        avatar_url: interpreter.photo_url || interpreter.profiles?.avatar_url,
      };
    });

    return createSuccessResponse(interpreters, {
      page,
      limit,
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
