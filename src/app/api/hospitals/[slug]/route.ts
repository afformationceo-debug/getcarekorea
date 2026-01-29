/**
 * Hospital Detail API
 *
 * GET /api/hospitals/[slug] - Get hospital by slug with related data
 * PUT /api/hospitals/[slug] - Update hospital (admin/owner only)
 * DELETE /api/hospitals/[slug] - Delete hospital (admin only)
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

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const locale = searchParams.get('locale') || 'en';
    const includeDoctors = searchParams.get('includeDoctors') === 'true';
    const includeProcedures = searchParams.get('includeProcedures') === 'true';

    const startTime = Date.now();

    // Get hospital
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: hospitalData, error } = await (supabase.from('hospitals') as any)
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    const hospital = hospitalData as Hospital | null;

    if (error || !hospital) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Hospital not found', { slug }, locale);
    }

    // Build response with related data
    const response: Record<string, unknown> = { ...hospital };

    // Fetch related data in parallel
    const relatedPromises: Promise<void>[] = [];

    if (includeDoctors) {
      relatedPromises.push(
        (async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: doctors } = await (supabase.from('doctors') as any)
            .select('*')
            .eq('hospital_id', hospital.id)
            .eq('is_available', true)
            .order('years_experience', { ascending: false });
          response.doctors = doctors || [];
        })()
      );
    }

    if (includeProcedures) {
      relatedPromises.push(
        (async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: procedures } = await (supabase.from('procedures') as any)
            .select('*')
            .eq('hospital_id', hospital.id)
            .order('is_popular', { ascending: false });
          response.procedures = procedures || [];
        })()
      );
    }

    await Promise.all(relatedPromises);

    const responseTime = Date.now() - startTime;
    secureLog('info', 'Hospital detail fetched', {
      slug,
      responseTimeMs: responseTime,
      includeDoctors,
      includeProcedures,
    });

    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Get existing hospital
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: hospital, error: fetchError } = await (supabase.from('hospitals') as any)
      .select('id, admin_id')
      .eq('slug', slug)
      .single();

    if (fetchError || !hospital) {
      throw new APIError(ErrorCode.NOT_FOUND);
    }

    // Check user role and ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isOwner = hospital.admin_id === user.id;

    if (!isAdmin && !isOwner) {
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Parse request body
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    const { id, created_at, admin_id: _, ...updateData } = body;

    // Only admins can change status to published
    if (updateData.status === 'published' && !isAdmin) {
      delete updateData.status;
    }

    // Update hospital
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase.from('hospitals') as any)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', hospital.id)
      .select()
      .single();

    if (updateError) {
      secureLog('error', 'Error updating hospital', { error: updateError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR);
    }

    secureLog('info', 'Hospital updated', {
      hospitalId: hospital.id,
      slug,
      updatedBy: user.id,
    });

    return createSuccessResponse(updated);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Check admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Delete hospital (cascade will handle related records)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase.from('hospitals') as any)
      .delete()
      .eq('slug', slug);

    if (deleteError) {
      secureLog('error', 'Error deleting hospital', { error: deleteError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR);
    }

    secureLog('info', 'Hospital deleted', {
      slug,
      deletedBy: user.id,
    });

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
