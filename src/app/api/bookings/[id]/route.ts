/**
 * Booking Detail API
 *
 * GET /api/bookings/[id] - Get booking details
 * PUT /api/bookings/[id] - Update booking status/details
 * DELETE /api/bookings/[id] - Cancel booking
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Get booking with related data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking, error } = await (supabase.from('bookings') as any)
      .select(`
        *,
        hospitals (id, slug, name_en, city, phone, email, address, logo_url),
        procedures (id, slug, name_en, price_min, price_max, duration_minutes, recovery_days),
        doctors (id, name_en, photo_url, specialties),
        interpreters (
          id,
          hourly_rate,
          daily_rate,
          profiles!interpreters_profile_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !booking) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Booking not found', { id }, locale);
    }

    // Check authorization - user must be booking owner, admin, hospital admin, or assigned interpreter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = booking.profile_id === user.id;
    const isAdmin = profile?.role === 'admin';

    // Check if hospital admin
    let isHospitalAdmin = false;
    if (profile?.role === 'hospital_admin' && booking.hospital_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: hospital } = await (supabase.from('hospitals') as any)
        .select('id')
        .eq('id', booking.hospital_id)
        .eq('admin_id', user.id)
        .single();
      isHospitalAdmin = !!hospital;
    }

    // Check if assigned interpreter
    let isAssignedInterpreter = false;
    if (profile?.role === 'interpreter' && booking.interpreter_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: interpreter } = await (supabase.from('interpreters') as any)
        .select('id')
        .eq('id', booking.interpreter_id)
        .eq('profile_id', user.id)
        .single();
      isAssignedInterpreter = !!interpreter;
    }

    if (!isOwner && !isAdmin && !isHospitalAdmin && !isAssignedInterpreter) {
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    return createSuccessResponse(booking);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Get existing booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking, error: fetchError } = await (supabase.from('bookings') as any)
      .select('id, profile_id, hospital_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Booking not found', { id }, locale);
    }

    // Check authorization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = booking.profile_id === user.id;
    const isAdmin = profile?.role === 'admin';

    // Check if hospital admin
    let isHospitalAdmin = false;
    if (profile?.role === 'hospital_admin' && booking.hospital_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: hospital } = await (supabase.from('hospitals') as any)
        .select('id')
        .eq('id', booking.hospital_id)
        .eq('admin_id', user.id)
        .single();
      isHospitalAdmin = !!hospital;
    }

    // Parse request body
    const body = await request.json();

    // Determine allowed updates based on role
    const updateData: Record<string, unknown> = {};

    // Patients can only update notes and cancel their booking
    if (isOwner && !isAdmin && !isHospitalAdmin) {
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.status === 'cancelled' && booking.status === 'pending') {
        updateData.status = 'cancelled';
      }
    }

    // Hospital admins can confirm or complete bookings
    if (isHospitalAdmin || isAdmin) {
      if (body.status !== undefined) {
        const allowedTransitions: Record<string, string[]> = {
          pending: ['confirmed', 'cancelled'],
          confirmed: ['completed', 'cancelled'],
          completed: [],
          cancelled: [],
        };
        if (allowedTransitions[booking.status]?.includes(body.status)) {
          updateData.status = body.status;
        }
      }
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.booking_date !== undefined) updateData.booking_date = body.booking_date;
      if (body.booking_time !== undefined) updateData.booking_time = body.booking_time;
      if (body.total_price !== undefined) updateData.total_price = body.total_price;
    }

    if (Object.keys(updateData).length === 0) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'No valid updates provided', undefined, locale);
    }

    updateData.updated_at = new Date().toISOString();

    // Update booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase.from('bookings') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      secureLog('error', 'Error updating booking', { error: updateError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    secureLog('info', 'Booking updated', {
      bookingId: id,
      updates: Object.keys(updateData),
      updatedBy: user.id,
    });

    // TODO: Send notification on status change

    return createSuccessResponse(updated);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Get existing booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking, error: fetchError } = await (supabase.from('bookings') as any)
      .select('id, profile_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Booking not found', { id }, locale);
    }

    // Check authorization - only owner or admin can delete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = booking.profile_id === user.id;
    const isAdmin = profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Only allow deletion of pending bookings (or by admin)
    if (!isAdmin && booking.status !== 'pending') {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Only pending bookings can be cancelled',
        { status: booking.status },
        locale
      );
    }

    // Soft delete by setting status to cancelled (keep the record)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('bookings') as any)
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      secureLog('error', 'Error cancelling booking', { error: updateError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    secureLog('info', 'Booking cancelled', {
      bookingId: id,
      cancelledBy: user.id,
    });

    return createSuccessResponse({ cancelled: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
