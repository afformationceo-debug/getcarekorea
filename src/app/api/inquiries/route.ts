/**
 * Inquiries API
 *
 * GET /api/inquiries - List inquiries (admin only)
 * POST /api/inquiries - Submit a new inquiry (public)
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

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

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

    if (!profile || !['admin', 'hospital_admin'].includes(profile.role)) {
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Filter parameters
    const status = searchParams.get('status');
    const hospitalId = searchParams.get('hospitalId');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('inquiries') as any)
      .select('*', { count: 'exact' });

    // Hospital admins can only see their hospital's inquiries
    if (profile.role === 'hospital_admin') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: hospital } = await (supabase.from('hospitals') as any)
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (hospital) {
        query = query.eq('hospital_id', hospital.id);
      } else {
        // No hospital assigned, return empty
        return createSuccessResponse([], { page, limit, total: 0, hasMore: false });
      }
    } else if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Order by created_at descending
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      secureLog('error', 'Database error fetching inquiries', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR);
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

    // Parse request body
    const body = await request.json();

    // Validate required fields
    validateRequired(body, ['name', 'email', 'message'], locale);

    // Validate email format
    if (!EMAIL_REGEX.test(body.email)) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid email format',
        { field: 'email' },
        locale
      );
    }

    // Sanitize input (basic XSS prevention)
    const sanitize = (str: string) => str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // Get authenticated user if available
    const { data: { user } } = await supabase.auth.getUser();

    // Create inquiry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inquiry, error } = await (supabase.from('inquiries') as any)
      .insert({
        profile_id: user?.id || null,
        hospital_id: body.hospital_id || null,
        name: sanitize(body.name),
        email: body.email.toLowerCase().trim(),
        phone: body.phone ? sanitize(body.phone) : null,
        messenger_type: body.messenger_type || null,
        messenger_id: body.messenger_id ? sanitize(body.messenger_id) : null,
        procedure_interest: body.procedure_interest ? sanitize(body.procedure_interest) : null,
        message: sanitize(body.message),
        locale,
        status: 'new',
        source: body.source || 'website',
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        communication_log: [],
      })
      .select()
      .single();

    if (error) {
      secureLog('error', 'Error creating inquiry', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    secureLog('info', 'Inquiry created', {
      inquiryId: inquiry.id,
      locale,
      source: body.source || 'website',
    });

    // Return success without exposing internal ID to public
    return createSuccessResponse({
      success: true,
      message: getSuccessMessage(locale),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

function getSuccessMessage(locale: string): string {
  const messages: Record<string, string> = {
    en: 'Thank you for your inquiry. We will contact you within 24 hours.',
    'zh-TW': '感謝您的詢問。我們將在24小時內與您聯繫。',
    'zh-CN': '感谢您的询问。我们将在24小时内与您联系。',
    ja: 'お問い合わせありがとうございます。24時間以内にご連絡いたします。',
    th: 'ขอบคุณสำหรับการสอบถาม เราจะติดต่อกลับภายใน 24 ชั่วโมง',
    mn: 'Лавлагаа илгээсэнд баярлалаа. Бид 24 цагийн дотор тантай холбогдох болно.',
    ru: 'Спасибо за ваш запрос. Мы свяжемся с вами в течение 24 часов.',
  };

  return messages[locale] || messages.en;
}
