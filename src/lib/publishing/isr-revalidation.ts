/**
 * ISR Revalidation
 *
 * Next.js ISR (Incremental Static Regeneration) 트리거
 * - 발행 시 페이지 재생성
 * - 온디맨드 revalidation
 */

// =====================================================
// TYPES
// =====================================================

export interface RevalidationResult {
  success: boolean;
  path: string;
  revalidatedAt?: string;
  error?: string;
}

export interface BatchRevalidationResult {
  total: number;
  successful: number;
  failed: number;
  results: RevalidationResult[];
}

// =====================================================
// REVALIDATION FUNCTIONS
// =====================================================

/**
 * 단일 경로 재검증
 */
export async function revalidatePath(
  path: string,
  secret: string
): Promise<RevalidationResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || '';

  if (!baseUrl) {
    return {
      success: false,
      path,
      error: 'Base URL not configured',
    };
  }

  try {
    const revalidateUrl = `${baseUrl}/api/revalidate?path=${encodeURIComponent(path)}&secret=${encodeURIComponent(secret)}`;

    const response = await fetch(revalidateUrl, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        path,
        error: `Revalidation failed: ${error}`,
      };
    }

    return {
      success: true,
      path,
      revalidatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      path,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 블로그 포스트 페이지 재검증
 */
export async function revalidateBlogPost(
  slug: string,
  locale: string,
  secret: string
): Promise<RevalidationResult> {
  const path = `/${locale}/blog/${slug}`;
  return revalidatePath(path, secret);
}

/**
 * 블로그 목록 페이지 재검증
 */
export async function revalidateBlogList(
  locale: string,
  secret: string
): Promise<RevalidationResult> {
  const path = `/${locale}/blog`;
  return revalidatePath(path, secret);
}

/**
 * 배치 재검증
 */
export async function revalidatePaths(
  paths: string[],
  secret: string
): Promise<BatchRevalidationResult> {
  const result: BatchRevalidationResult = {
    total: paths.length,
    successful: 0,
    failed: 0,
    results: [],
  };

  for (const path of paths) {
    const revalidationResult = await revalidatePath(path, secret);
    result.results.push(revalidationResult);

    if (revalidationResult.success) {
      result.successful++;
    } else {
      result.failed++;
    }
  }

  return result;
}

/**
 * 블로그 포스트 발행 시 관련 페이지 모두 재검증
 */
export async function revalidateOnPublish(
  slug: string,
  locale: string,
  secret: string
): Promise<BatchRevalidationResult> {
  const paths = [
    `/${locale}/blog/${slug}`, // 포스트 페이지
    `/${locale}/blog`, // 블로그 목록
    `/${locale}`, // 홈페이지 (최신 포스트 표시 시)
  ];

  return revalidatePaths(paths, secret);
}

/**
 * 모든 로케일의 블로그 목록 페이지 재검증
 */
export async function revalidateAllBlogLists(
  locales: string[],
  secret: string
): Promise<BatchRevalidationResult> {
  const paths = locales.map(locale => `/${locale}/blog`);
  return revalidatePaths(paths, secret);
}

// =====================================================
// TAG-BASED REVALIDATION (Next.js 14+)
// =====================================================

/**
 * 태그 기반 재검증 (Next.js 14+)
 */
export async function revalidateTag(
  tag: string,
  secret: string
): Promise<RevalidationResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || '';

  if (!baseUrl) {
    return {
      success: false,
      path: `tag:${tag}`,
      error: 'Base URL not configured',
    };
  }

  try {
    const revalidateUrl = `${baseUrl}/api/revalidate?tag=${encodeURIComponent(tag)}&secret=${encodeURIComponent(secret)}`;

    const response = await fetch(revalidateUrl, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        path: `tag:${tag}`,
        error: `Tag revalidation failed: ${error}`,
      };
    }

    return {
      success: true,
      path: `tag:${tag}`,
      revalidatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      path: `tag:${tag}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 블로그 관련 태그 재검증
 */
export async function revalidateBlogTags(secret: string): Promise<BatchRevalidationResult> {
  const tags = ['blog-posts', 'blog-list', 'latest-posts'];

  const result: BatchRevalidationResult = {
    total: tags.length,
    successful: 0,
    failed: 0,
    results: [],
  };

  for (const tag of tags) {
    const revalidationResult = await revalidateTag(tag, secret);
    result.results.push(revalidationResult);

    if (revalidationResult.success) {
      result.successful++;
    } else {
      result.failed++;
    }
  }

  return result;
}
