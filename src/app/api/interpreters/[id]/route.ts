/**
 * Interpreter Detail API
 *
 * GET /api/interpreters/[id] - Get interpreter by ID with profile and reviews
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

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const locale = searchParams.get('locale') || 'en';
    const includeReviews = searchParams.get('includeReviews') === 'true';

    const startTime = Date.now();

    // Get interpreter with profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: interpreterData, error } = await (supabase.from('interpreters') as any)
      .select(`
        *,
        profiles!interpreters_profile_id_fkey (
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('id', id)
      .single();

    interface InterpreterWithProfile {
      id: string;
      bio_en: string | null;
      photo_url: string | null;
      profiles?: { full_name: string; avatar_url: string | null; email: string };
      [key: string]: unknown;
    }

    const interpreter = interpreterData as InterpreterWithProfile | null;

    if (error || !interpreter) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Interpreter not found', { id }, locale);
    }

    // Build response
    const bioKey = `bio_${locale.replace('-', '_').toLowerCase()}`;
    const response: Record<string, unknown> = {
      ...interpreter,
      bio: (interpreter[bioKey] as string) || interpreter.bio_en,
      full_name: interpreter.profiles?.full_name,
      avatar_url: interpreter.photo_url || interpreter.profiles?.avatar_url,
    };

    // Fetch reviews if requested
    if (includeReviews) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reviews, count } = await (supabase.from('reviews') as any)
        .select('*, profiles!reviews_profile_id_fkey(full_name, avatar_url)', { count: 'exact' })
        .eq('interpreter_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      response.reviews = reviews || [];
      response.reviewCount = count || 0;
    }

    const responseTime = Date.now() - startTime;
    secureLog('info', 'Interpreter detail fetched', {
      id,
      responseTimeMs: responseTime,
      includeReviews,
    });

    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}
