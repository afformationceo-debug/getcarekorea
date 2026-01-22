/**
 * Dynamic Sitemap API
 *
 * GET /api/sitemap - 동적 사이트맵 XML 생성
 * POST /api/sitemap - 사이트맵 재생성 및 검색 엔진 알림
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateFullSitemap,
  generateBlogSitemap,
  pingSearchEngines,
} from '@/lib/publishing';

export const runtime = 'nodejs';

/**
 * GET /api/sitemap
 * 사이트맵 XML 생성 및 반환
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full'; // 'full' | 'blog'
    const format = searchParams.get('format') || 'xml'; // 'xml' | 'json'

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getcarekorea.com';

    let result;
    if (type === 'blog') {
      result = await generateBlogSitemap(supabase, baseUrl);
    } else {
      result = await generateFullSitemap(supabase, baseUrl);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to generate sitemap' },
        { status: 500 }
      );
    }

    // JSON 형식으로 반환
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          urlCount: result.urlCount,
          generatedAt: result.generatedAt,
        },
      });
    }

    // XML 형식으로 반환
    return new NextResponse(result.xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sitemap
 * 사이트맵 재생성 및 검색 엔진 알림 (관리자 전용)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { pingEngines = true } = body;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getcarekorea.com';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;

    // 사이트맵 생성
    const result = await generateFullSitemap(supabase, baseUrl);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to generate sitemap' },
        { status: 500 }
      );
    }

    // 검색 엔진 알림
    let pingResults = null;
    if (pingEngines) {
      pingResults = await pingSearchEngines(sitemapUrl);
    }

    return NextResponse.json({
      success: true,
      data: {
        urlCount: result.urlCount,
        generatedAt: result.generatedAt,
        pingResults,
      },
      message: `Sitemap generated with ${result.urlCount} URLs`,
    });
  } catch (error) {
    console.error('Sitemap regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate sitemap' },
      { status: 500 }
    );
  }
}
