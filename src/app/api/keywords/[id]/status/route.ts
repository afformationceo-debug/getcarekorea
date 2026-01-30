/**
 * Keyword Status Update API
 *
 * POST /api/keywords/[id]/status - Update keyword status
 *
 * Body: { status: 'pending' | 'generating' | 'generated' | 'published' }
 */

import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
} from '@/lib/api/error-handler';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Note: We only require authentication, not admin role
    // The content generation API handles the actual authorization
    // This endpoint just updates status for UI responsiveness
    secureLog('info', 'Status update requested', { userId: user.id });

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'generating', 'generated', 'published'];
    if (!status || !validStatuses.includes(status)) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      );
    }

    // Update keyword status with admin client (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (adminClient.from('content_keywords') as any)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      secureLog('error', 'Error updating keyword status', { error: updateError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR);
    }

    if (!updated) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Keyword not found');
    }

    secureLog('info', 'Keyword status updated', {
      keywordId: id,
      newStatus: status,
      updatedBy: user.id,
    });

    return createSuccessResponse(updated);
  } catch (error) {
    return createErrorResponse(error);
  }
}
