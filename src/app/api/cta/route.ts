/**
 * CTA Settings API
 *
 * GET /api/cta?locale=en - Get CTA for specific locale only
 * locale parameter is REQUIRED - returns empty response if not provided
 *
 * This is a dedicated endpoint for CTA data only.
 * Does NOT expose other system_settings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Dynamic route - uses query params
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');

    // locale is required - return empty if not provided
    if (!locale) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const supabase = await createAdminClient();

    // Only fetch cta_links key - no other settings exposed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', 'cta_links')
      .single();

    if (error || !data?.value) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Return only the specified locale's CTA
    const localeData = data.value[locale] || null;
    return NextResponse.json({
      success: true,
      data: localeData,
    });
  } catch (error) {
    console.error('CTA API error:', error);
    return NextResponse.json({
      success: true,
      data: null,
    });
  }
}
