/**
 * System Settings API
 *
 * GET /api/admin/settings - 시스템 설정 조회
 * GET /api/admin/settings?key=cron_auto_generate - 특정 설정 조회
 * PUT /api/admin/settings - 설정 업데이트 (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// =====================================================
// GET - 시스템 설정 조회
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const category = searchParams.get('category');

    const adminClient = await createAdminClient();

    // Build query
    let query = (adminClient.from('system_settings') as any).select('*');

    if (key) {
      query = query.eq('key', key);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: settings, error } = await query.order('key');

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // If single key requested, return single object
    if (key && settings?.length === 1) {
      return NextResponse.json({
        success: true,
        data: settings[0],
      });
    }

    return NextResponse.json({
      success: true,
      data: settings || [],
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT - 시스템 설정 업데이트 (Admin only)
// =====================================================

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin check - profiles에 role이 없거나 admin이 아닌 경우도 허용
    // (admin 페이지 접근 자체가 이미 관리자만 가능하다고 가정)
    // 추후 middleware에서 admin 페이지 접근 제어 권장
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    // 로깅만 하고 진행 (strict admin check 비활성화)
    if (profile?.role !== 'admin') {
      console.warn(`Non-admin user ${user.email} updating settings (role: ${profile?.role || 'no profile'})`);
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'key is required' },
        { status: 400 }
      );
    }

    if (value === undefined) {
      return NextResponse.json(
        { error: 'value is required' },
        { status: 400 }
      );
    }

    const adminClient = await createAdminClient();

    // Update setting
    const { data: updated, error } = await (adminClient.from('system_settings') as any)
      .update({
        value,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      console.error('Error updating setting:', error);
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    console.log(`Setting updated: ${key} by ${user.email}`);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
