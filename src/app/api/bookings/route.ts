/**
 * Bookings API
 *
 * GET /api/bookings - List user's bookings (authenticated)
 * POST /api/bookings - Create a new booking (authenticated)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
  validateRequired,
} from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Get user role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    const locale = searchParams.get('locale') || 'en';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');

    // Build query based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('bookings') as any)
      .select(`
        *,
        hospitals (id, slug, name_en, city, logo_url),
        procedures (id, slug, name_en, price_min, price_max),
        doctors (id, name_en, photo_url),
        interpreters (id, hourly_rate, profiles!interpreters_profile_id_fkey(full_name))
      `, { count: 'exact' });

    // Filter based on user role
    if (profile?.role === 'admin') {
      // Admins see all bookings
    } else if (profile?.role === 'hospital_admin') {
      // Hospital admins see their hospital's bookings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: hospital } = await (supabase.from('hospitals') as any)
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (hospital) {
        query = query.eq('hospital_id', hospital.id);
      } else {
        return createSuccessResponse([], { page, limit, total: 0, hasMore: false });
      }
    } else if (profile?.role === 'interpreter') {
      // Interpreters see their assigned bookings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: interpreter } = await (supabase.from('interpreters') as any)
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (interpreter) {
        query = query.eq('interpreter_id', interpreter.id);
      } else {
        return createSuccessResponse([], { page, limit, total: 0, hasMore: false });
      }
    } else {
      // Patients see their own bookings
      query = query.eq('profile_id', user.id);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Order and paginate
    query = query
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      secureLog('error', 'Error fetching bookings', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    return createSuccessResponse(data || [], {
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
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED, undefined, undefined, locale);
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    validateRequired(body, ['hospital_id', 'booking_date'], locale);

    // Validate booking date is in the future
    const bookingDate = new Date(body.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Booking date must be in the future',
        { field: 'booking_date' },
        locale
      );
    }

    // Verify hospital exists and is published
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: hospital, error: hospitalError } = await (supabase.from('hospitals') as any)
      .select('id, name_en')
      .eq('id', body.hospital_id)
      .eq('status', 'published')
      .single();

    if (hospitalError || !hospital) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid hospital',
        { field: 'hospital_id' },
        locale
      );
    }

    // Verify interpreter if provided
    if (body.interpreter_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: interpreter, error: interpreterError } = await (supabase.from('interpreters') as any)
        .select('id')
        .eq('id', body.interpreter_id)
        .eq('is_available', true)
        .single();

      if (interpreterError || !interpreter) {
        throw new APIError(
          ErrorCode.VALIDATION_ERROR,
          'Invalid or unavailable interpreter',
          { field: 'interpreter_id' },
          locale
        );
      }
    }

    // Create booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking, error: insertError } = await (supabase.from('bookings') as any)
      .insert({
        profile_id: user.id,
        hospital_id: body.hospital_id,
        procedure_id: body.procedure_id || null,
        doctor_id: body.doctor_id || null,
        interpreter_id: body.interpreter_id || null,
        booking_date: body.booking_date,
        booking_time: body.booking_time || null,
        status: 'pending',
        notes: body.notes || null,
        total_price: body.total_price || null,
      })
      .select()
      .single();

    if (insertError) {
      secureLog('error', 'Error creating booking', { error: insertError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    secureLog('info', 'Booking created', {
      bookingId: booking.id,
      hospitalId: body.hospital_id,
      userId: user.id,
    });

    // TODO: Send notification to hospital/user via email or messenger

    return createSuccessResponse({
      success: true,
      booking: booking,
      message: getBookingSuccessMessage(locale),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

function getBookingSuccessMessage(locale: string): string {
  const messages: Record<string, string> = {
    en: 'Your booking request has been submitted. We will confirm your appointment within 24 hours.',
    'zh-TW': '您的預約請求已提交。我們將在24小時內確認您的預約。',
    'zh-CN': '您的预约请求已提交。我们将在24小时内确认您的预约。',
    ja: 'ご予約リクエストが送信されました。24時間以内にご予約を確認いたします。',
    th: 'คำขอจองของคุณได้ถูกส่งแล้ว เราจะยืนยันนัดหมายของคุณภายใน 24 ชั่วโมง',
    mn: 'Таны захиалгын хүсэлт илгээгдсэн. Бид таны уулзалтыг 24 цагийн дотор баталгаажуулна.',
    ru: 'Ваш запрос на бронирование отправлен. Мы подтвердим вашу запись в течение 24 часов.',
  };
  return messages[locale] || messages.en;
}
