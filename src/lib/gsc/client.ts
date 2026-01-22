/**
 * Google Search Console API Client
 *
 * GSC API 연동을 위한 클라이언트
 * - OAuth 2.0 인증
 * - 성과 데이터 조회
 * - 페이지별/쿼리별 데이터 수집
 */

import { google } from 'googleapis';

// =====================================================
// TYPES
// =====================================================

export interface GSCCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface GSCPerformanceData {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date?: string;
}

export interface GSCPagePerformance {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  queries: GSCQueryData[];
}

export interface GSCQueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCFetchOptions {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'date')[];
  rowLimit?: number;
  startRow?: number;
}

// =====================================================
// GSC CLIENT CLASS
// =====================================================

export class GSCClient {
  private searchConsole;
  private siteUrl: string;

  constructor(credentials: GSCCredentials, siteUrl: string) {
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });

    this.searchConsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client,
    });

    this.siteUrl = siteUrl;
  }

  /**
   * 성과 데이터 조회 (페이지별)
   */
  async getPagePerformance(
    startDate: string,
    endDate: string,
    rowLimit: number = 1000
  ): Promise<GSCPerformanceData[]> {
    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page', 'query'],
          rowLimit,
          dataState: 'final',
        },
      });

      if (!response.data.rows) {
        return [];
      }

      return response.data.rows.map((row) => ({
        page: row.keys?.[0] || '',
        query: row.keys?.[1] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));
    } catch (error) {
      console.error('GSC API error:', error);
      throw new Error(`Failed to fetch GSC data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 특정 페이지의 성과 데이터 조회
   */
  async getPerformanceForPage(
    pageUrl: string,
    startDate: string,
    endDate: string
  ): Promise<GSCPagePerformance | null> {
    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: 'page',
                  operator: 'equals',
                  expression: pageUrl,
                },
              ],
            },
          ],
          rowLimit: 100,
          dataState: 'final',
        },
      });

      if (!response.data.rows || response.data.rows.length === 0) {
        return null;
      }

      // 총합 계산
      let totalClicks = 0;
      let totalImpressions = 0;
      let weightedPosition = 0;

      const queries: GSCQueryData[] = response.data.rows.map((row) => {
        const clicks = row.clicks || 0;
        const impressions = row.impressions || 0;
        const position = row.position || 0;

        totalClicks += clicks;
        totalImpressions += impressions;
        weightedPosition += position * impressions;

        return {
          query: row.keys?.[0] || '',
          clicks,
          impressions,
          ctr: row.ctr || 0,
          position,
        };
      });

      const avgPosition = totalImpressions > 0 ? weightedPosition / totalImpressions : 0;
      const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

      return {
        page: pageUrl,
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: avgCtr,
        position: avgPosition,
        queries,
      };
    } catch (error) {
      console.error('GSC API error for page:', pageUrl, error);
      return null;
    }
  }

  /**
   * 모든 페이지의 집계 성과 데이터
   */
  async getAllPagesPerformance(
    startDate: string,
    endDate: string,
    rowLimit: number = 1000
  ): Promise<GSCPagePerformance[]> {
    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit,
          dataState: 'final',
        },
      });

      if (!response.data.rows) {
        return [];
      }

      return response.data.rows.map((row) => ({
        page: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
        queries: [], // 쿼리별 데이터는 별도 조회 필요
      }));
    } catch (error) {
      console.error('GSC API error:', error);
      throw new Error(`Failed to fetch pages performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 사이트 목록 조회 (인증 테스트용)
   */
  async listSites(): Promise<string[]> {
    try {
      const response = await this.searchConsole.sites.list();
      return response.data.siteEntry?.map((site) => site.siteUrl || '') || [];
    } catch (error) {
      console.error('GSC sites list error:', error);
      throw new Error(`Failed to list sites: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * 환경 변수에서 GSC 클라이언트 생성
 */
export function createGSCClient(): GSCClient | null {
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;
  const siteUrl = process.env.GSC_SITE_URL;

  if (!clientId || !clientSecret || !refreshToken || !siteUrl) {
    console.warn('GSC credentials not configured. Skipping GSC integration.');
    return null;
  }

  return new GSCClient(
    { clientId, clientSecret, refreshToken },
    siteUrl
  );
}

/**
 * 날짜 포맷 헬퍼 (YYYY-MM-DD)
 */
export function formatDateForGSC(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 지난 N일간의 날짜 범위 계산
 */
export function getDateRange(daysAgo: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2); // GSC 데이터는 2일 지연

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - daysAgo);

  return {
    startDate: formatDateForGSC(startDate),
    endDate: formatDateForGSC(endDate),
  };
}

// =====================================================
// PERFORMANCE TIER CLASSIFICATION
// =====================================================

export type PerformanceTier = 'top' | 'mid' | 'low';

export interface TierCriteria {
  topCtrThreshold: number;
  topPositionThreshold: number;
  midCtrMin: number;
  midCtrMax: number;
  midPositionMin: number;
  midPositionMax: number;
}

const DEFAULT_TIER_CRITERIA: TierCriteria = {
  topCtrThreshold: 0.05, // 5%
  topPositionThreshold: 10,
  midCtrMin: 0.02, // 2%
  midCtrMax: 0.05, // 5%
  midPositionMin: 10,
  midPositionMax: 30,
};

/**
 * 성과 등급 분류
 */
export function classifyPerformanceTier(
  ctr: number,
  position: number,
  criteria: TierCriteria = DEFAULT_TIER_CRITERIA
): PerformanceTier {
  // Top: CTR > 5% AND Position < 10
  if (ctr > criteria.topCtrThreshold && position < criteria.topPositionThreshold) {
    return 'top';
  }

  // Mid: CTR 2-5% OR Position 10-30
  if (
    (ctr >= criteria.midCtrMin && ctr <= criteria.midCtrMax) ||
    (position >= criteria.midPositionMin && position <= criteria.midPositionMax)
  ) {
    return 'mid';
  }

  // Low: 기본
  return 'low';
}

/**
 * 고성과 콘텐츠 여부 판단
 */
export function isHighPerformer(
  ctr: number,
  clicks: number,
  position: number,
  impressions: number
): boolean {
  return (
    ctr >= 0.03 && // CTR >= 3%
    clicks >= 50 && // 최소 50 클릭
    position <= 20 && // 상위 20위 이내
    impressions >= 500 // 최소 500 노출
  );
}
