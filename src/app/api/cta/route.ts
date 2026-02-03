/**
 * CTA Settings API
 *
 * GET /api/cta - Get CTA settings for all locales (public, cached)
 *
 * This is a dedicated endpoint for CTA data only.
 * Does NOT expose other system_settings.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Cache for 5 minutes
export const revalidate = 300;

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Only fetch cta_links key - no other settings exposed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', 'cta_links')
      .single();

    if (error || !data?.value) {
      // Return empty object if no CTA settings (not an error)
      return NextResponse.json({
        success: true,
        data: {},
      });
    }

    return NextResponse.json({
      success: true,
      data: data.value,
    });
  } catch (error) {
    console.error('CTA API error:', error);
    return NextResponse.json({
      success: true,
      data: {}, // Return empty on error, don't expose error details
    });
  }
}
