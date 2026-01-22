/**
 * GSC Data Collector
 *
 * GSC 데이터 수집 및 DB 저장
 * - 일일 성과 데이터 수집
 * - content_performance 테이블 업데이트
 * - 성과 등급 자동 분류
 * - 학습 파이프라인 트리거
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  createGSCClient,
  getDateRange,
  classifyPerformanceTier,
  isHighPerformer,
  GSCPagePerformance,
} from './client';

// =====================================================
// TYPES
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

export interface DataCollectionResult {
  success: boolean;
  pagesProcessed: number;
  newRecords: number;
  updatedRecords: number;
  highPerformers: number;
  errors: string[];
}

export interface ContentPerformanceRecord {
  blog_post_id: string;
  keyword_id?: string;
  gsc_impressions: number;
  gsc_clicks: number;
  gsc_ctr: number;
  gsc_position: number;
  date_range_start: string;
  date_range_end: string;
  is_high_performer: boolean;
  performance_tier: 'top' | 'mid' | 'low';
}

// =====================================================
// DATA COLLECTION FUNCTIONS
// =====================================================

/**
 * GSC 데이터 수집 및 저장 (메인 함수)
 */
export async function collectGSCData(
  supabase: AnySupabaseClient,
  daysAgo: number = 28
): Promise<DataCollectionResult> {
  const result: DataCollectionResult = {
    success: false,
    pagesProcessed: 0,
    newRecords: 0,
    updatedRecords: 0,
    highPerformers: 0,
    errors: [],
  };

  const gscClient = createGSCClient();
  if (!gscClient) {
    result.errors.push('GSC client not configured');
    return result;
  }

  try {
    const { startDate, endDate } = getDateRange(daysAgo);

    // GSC에서 모든 페이지 성과 데이터 조회
    const pagesPerformance = await gscClient.getAllPagesPerformance(startDate, endDate, 1000);
    result.pagesProcessed = pagesPerformance.length;

    // 블로그 포스트 URL 매핑
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('id, slug, locale');

    if (!blogPosts || blogPosts.length === 0) {
      result.errors.push('No blog posts found');
      return result;
    }

    // slug → id 매핑 생성
    const siteUrl = process.env.GSC_SITE_URL || '';
    const postUrlMap = new Map<string, { id: string; locale: string }>();

    for (const post of blogPosts) {
      // URL 패턴: {siteUrl}/{locale}/blog/{slug}
      const fullUrl = `${siteUrl}/${post.locale}/blog/${post.slug}`;
      postUrlMap.set(fullUrl, { id: post.id, locale: post.locale });

      // 트레일링 슬래시 없는 버전도 추가
      const urlWithoutTrailing = fullUrl.replace(/\/$/, '');
      postUrlMap.set(urlWithoutTrailing, { id: post.id, locale: post.locale });
    }

    // 각 페이지 성과 데이터 처리
    for (const pageData of pagesPerformance) {
      const postInfo = postUrlMap.get(pageData.page) || postUrlMap.get(pageData.page.replace(/\/$/, ''));

      if (!postInfo) {
        // 블로그 포스트가 아닌 페이지는 건너뜀
        continue;
      }

      const tier = classifyPerformanceTier(pageData.ctr, pageData.position);
      const highPerformer = isHighPerformer(
        pageData.ctr,
        pageData.clicks,
        pageData.position,
        pageData.impressions
      );

      if (highPerformer) {
        result.highPerformers++;
      }

      // 기존 레코드 확인 (같은 기간)
      const { data: existing } = await supabase
        .from('content_performance')
        .select('id')
        .eq('blog_post_id', postInfo.id)
        .eq('date_range_start', startDate)
        .eq('date_range_end', endDate)
        .single();

      const record: ContentPerformanceRecord = {
        blog_post_id: postInfo.id,
        gsc_impressions: pageData.impressions,
        gsc_clicks: pageData.clicks,
        gsc_ctr: pageData.ctr,
        gsc_position: pageData.position,
        date_range_start: startDate,
        date_range_end: endDate,
        is_high_performer: highPerformer,
        performance_tier: tier,
      };

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('content_performance')
          .update({
            ...record,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) {
          result.errors.push(`Failed to update record for ${postInfo.id}: ${error.message}`);
        } else {
          result.updatedRecords++;
        }
      } else {
        // 신규 생성
        const { error } = await supabase
          .from('content_performance')
          .insert(record);

        if (error) {
          result.errors.push(`Failed to insert record for ${postInfo.id}: ${error.message}`);
        } else {
          result.newRecords++;
        }
      }
    }

    result.success = true;
  } catch (error) {
    result.errors.push(`Collection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * 특정 블로그 포스트의 GSC 데이터 수집
 */
export async function collectGSCDataForPost(
  supabase: AnySupabaseClient,
  blogPostId: string,
  daysAgo: number = 28
): Promise<GSCPagePerformance | null> {
  const gscClient = createGSCClient();
  if (!gscClient) {
    return null;
  }

  try {
    // 포스트 정보 조회
    const { data: post } = await supabase
      .from('blog_posts')
      .select('slug, locale')
      .eq('id', blogPostId)
      .single();

    if (!post) {
      return null;
    }

    const siteUrl = process.env.GSC_SITE_URL || '';
    const pageUrl = `${siteUrl}/${post.locale}/blog/${post.slug}`;

    const { startDate, endDate } = getDateRange(daysAgo);
    const performance = await gscClient.getPerformanceForPage(pageUrl, startDate, endDate);

    if (performance) {
      // DB에 저장
      const tier = classifyPerformanceTier(performance.ctr, performance.position);
      const highPerformer = isHighPerformer(
        performance.ctr,
        performance.clicks,
        performance.position,
        performance.impressions
      );

      await supabase
        .from('content_performance')
        .upsert({
          blog_post_id: blogPostId,
          gsc_impressions: performance.impressions,
          gsc_clicks: performance.clicks,
          gsc_ctr: performance.ctr,
          gsc_position: performance.position,
          date_range_start: startDate,
          date_range_end: endDate,
          is_high_performer: highPerformer,
          performance_tier: tier,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'blog_post_id,date_range_start,date_range_end',
        });
    }

    return performance;
  } catch (error) {
    console.error('Failed to collect GSC data for post:', blogPostId, error);
    return null;
  }
}

// =====================================================
// BATCH PROCESSING
// =====================================================

/**
 * 모든 발행된 포스트의 GSC 데이터 수집 (배치)
 */
export async function collectGSCDataBatch(
  supabase: AnySupabaseClient,
  options: {
    daysAgo?: number;
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<DataCollectionResult> {
  const { daysAgo = 28, batchSize = 50, onProgress } = options;

  const result: DataCollectionResult = {
    success: false,
    pagesProcessed: 0,
    newRecords: 0,
    updatedRecords: 0,
    highPerformers: 0,
    errors: [],
  };

  try {
    // 발행된 포스트 목록 조회
    const { data: posts, count } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact' })
      .eq('status', 'published');

    if (!posts || posts.length === 0) {
      result.errors.push('No published posts found');
      return result;
    }

    const totalPosts = count || posts.length;

    // 배치 처리
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);

      for (const post of batch) {
        const performance = await collectGSCDataForPost(supabase, post.id, daysAgo);

        if (performance) {
          result.pagesProcessed++;

          if (isHighPerformer(
            performance.ctr,
            performance.clicks,
            performance.position,
            performance.impressions
          )) {
            result.highPerformers++;
          }
        }
      }

      if (onProgress) {
        onProgress(Math.min(i + batchSize, totalPosts), totalPosts);
      }
    }

    result.success = true;
  } catch (error) {
    result.errors.push(`Batch collection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

// =====================================================
// PERFORMANCE SUMMARY
// =====================================================

export interface PerformanceSummary {
  totalPosts: number;
  topTier: number;
  midTier: number;
  lowTier: number;
  highPerformers: number;
  avgCtr: number;
  avgPosition: number;
  totalClicks: number;
  totalImpressions: number;
}

/**
 * 전체 성과 요약 조회
 */
export async function getPerformanceSummary(
  supabase: AnySupabaseClient,
  daysAgo: number = 28
): Promise<PerformanceSummary | null> {
  try {
    const { startDate, endDate } = getDateRange(daysAgo);

    const { data: records } = await supabase
      .from('content_performance')
      .select('*')
      .gte('date_range_start', startDate)
      .lte('date_range_end', endDate);

    if (!records || records.length === 0) {
      return null;
    }

    let totalClicks = 0;
    let totalImpressions = 0;
    let weightedPosition = 0;
    let topTier = 0;
    let midTier = 0;
    let lowTier = 0;
    let highPerformers = 0;

    for (const record of records) {
      totalClicks += record.gsc_clicks || 0;
      totalImpressions += record.gsc_impressions || 0;
      weightedPosition += (record.gsc_position || 0) * (record.gsc_impressions || 0);

      if (record.performance_tier === 'top') topTier++;
      else if (record.performance_tier === 'mid') midTier++;
      else lowTier++;

      if (record.is_high_performer) highPerformers++;
    }

    return {
      totalPosts: records.length,
      topTier,
      midTier,
      lowTier,
      highPerformers,
      avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      avgPosition: totalImpressions > 0 ? weightedPosition / totalImpressions : 0,
      totalClicks,
      totalImpressions,
    };
  } catch (error) {
    console.error('Failed to get performance summary:', error);
    return null;
  }
}

/**
 * 로케일별 성과 요약
 */
export async function getPerformanceSummaryByLocale(
  supabase: AnySupabaseClient,
  daysAgo: number = 28
): Promise<Map<string, PerformanceSummary> | null> {
  try {
    const { startDate, endDate } = getDateRange(daysAgo);

    // 성과 데이터와 블로그 포스트 조인
    const { data: records } = await supabase
      .from('content_performance')
      .select(`
        *,
        blog_posts!inner(locale)
      `)
      .gte('date_range_start', startDate)
      .lte('date_range_end', endDate);

    if (!records || records.length === 0) {
      return null;
    }

    const summaryByLocale = new Map<string, {
      posts: number;
      clicks: number;
      impressions: number;
      weightedPosition: number;
      top: number;
      mid: number;
      low: number;
      highPerformers: number;
    }>();

    for (const record of records) {
      const locale = record.blog_posts?.locale || 'unknown';

      if (!summaryByLocale.has(locale)) {
        summaryByLocale.set(locale, {
          posts: 0,
          clicks: 0,
          impressions: 0,
          weightedPosition: 0,
          top: 0,
          mid: 0,
          low: 0,
          highPerformers: 0,
        });
      }

      const summary = summaryByLocale.get(locale)!;
      summary.posts++;
      summary.clicks += record.gsc_clicks || 0;
      summary.impressions += record.gsc_impressions || 0;
      summary.weightedPosition += (record.gsc_position || 0) * (record.gsc_impressions || 0);

      if (record.performance_tier === 'top') summary.top++;
      else if (record.performance_tier === 'mid') summary.mid++;
      else summary.low++;

      if (record.is_high_performer) summary.highPerformers++;
    }

    // 결과 변환
    const result = new Map<string, PerformanceSummary>();

    for (const [locale, summary] of summaryByLocale) {
      result.set(locale, {
        totalPosts: summary.posts,
        topTier: summary.top,
        midTier: summary.mid,
        lowTier: summary.low,
        highPerformers: summary.highPerformers,
        avgCtr: summary.impressions > 0 ? summary.clicks / summary.impressions : 0,
        avgPosition: summary.impressions > 0 ? summary.weightedPosition / summary.impressions : 0,
        totalClicks: summary.clicks,
        totalImpressions: summary.impressions,
      });
    }

    return result;
  } catch (error) {
    console.error('Failed to get performance summary by locale:', error);
    return null;
  }
}
