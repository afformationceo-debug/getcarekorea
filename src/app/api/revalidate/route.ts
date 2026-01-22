/**
 * ISR Revalidation API
 *
 * POST /api/revalidate - 페이지 재검증 트리거
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export const runtime = 'nodejs';

// 재검증 비밀 키 (환경 변수에서 설정)
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

interface RevalidateRequest {
  paths?: string[];
  tags?: string[];
  secret?: string;
}

/**
 * POST /api/revalidate
 * 특정 경로 또는 태그 재검증
 */
export async function POST(request: NextRequest) {
  try {
    const body: RevalidateRequest = await request.json();
    const { paths, tags, secret } = body;

    // 비밀 키 검증 (설정된 경우)
    if (REVALIDATION_SECRET && secret !== REVALIDATION_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    const results: {
      paths: { path: string; success: boolean }[];
      tags: { tag: string; success: boolean }[];
    } = {
      paths: [],
      tags: [],
    };

    // 경로 재검증
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        try {
          revalidatePath(path);
          results.paths.push({ path, success: true });
        } catch (error) {
          console.error(`Failed to revalidate path: ${path}`, error);
          results.paths.push({ path, success: false });
        }
      }
    }

    // 태그 재검증
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        try {
          revalidateTag(tag, 'max');
          results.tags.push({ tag, success: true });
        } catch (error) {
          console.error(`Failed to revalidate tag: ${tag}`, error);
          results.tags.push({ tag, success: false });
        }
      }
    }

    const totalRevalidated =
      results.paths.filter((p) => p.success).length +
      results.tags.filter((t) => t.success).length;

    return NextResponse.json({
      success: true,
      data: {
        revalidated: totalRevalidated,
        results,
      },
      message: `Revalidated ${totalRevalidated} items`,
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/revalidate
 * 재검증 상태 확인 (헬스체크)
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Revalidation endpoint is active',
    hasSecret: !!REVALIDATION_SECRET,
  });
}
