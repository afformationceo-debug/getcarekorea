/**
 * Keywords Bulk Import API - Enhanced V2
 *
 * POST /api/keywords/bulk - Bulk import keywords from CSV data
 *
 * Features:
 * - CSV 데이터 일괄 등록 (V1 & V2 포맷 지원)
 * - 중복 체크 (로케일 + 키워드 조합)
 * - 트랜잭션 처리
 * - 언어별 그룹화 통계
 * - 경쟁도 및 우선순위 자동 계산
 * - 상세 결과 리포트
 */

import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
} from '@/lib/api/error-handler';

// V2 파서 import (V1도 하위 호환성을 위해 import)
import {
  parseCSVV2,
  calculatePriority,
  generateCSVTemplateV2,
  generateLegacyTemplate,
  type ParsedKeywordV2,
  type CSVParseOptionsV2,
  type CSVParseResultV2,
} from '@/lib/content/csv-parser-v2';

import type { Locale } from '@/lib/i18n/config';

// =====================================================
// CONSTANTS
// =====================================================

// 지원 로케일 목록 (ko 추가)
const SUPPORTED_LOCALES: Locale[] = ['ko', 'en', 'zh-TW', 'zh-CN', 'ja', 'th', 'mn', 'ru'];

// 지원 카테고리 목록
const SUPPORTED_CATEGORIES = [
  'plastic-surgery',
  'dermatology',
  'dental',
  'health-checkup',
  'general',
  'ophthalmology',
  'orthopedics',
  'fertility',
  'hair-transplant',
];

// =====================================================
// TYPES
// =====================================================

interface BulkImportRequest {
  // CSV 문자열 또는 파싱된 키워드 배열
  csv_content?: string;
  keywords?: ParsedKeywordV2[];

  // 옵션
  locale?: Locale;              // Optional now (auto-detect)
  category?: string;
  delimiter?: string;
  skip_header?: boolean;
  skip_duplicates?: boolean;    // 중복 키워드 스킵 여부
  update_existing?: boolean;    // 기존 키워드 업데이트 여부
  auto_detect_language?: boolean; // 언어 자동 감지 (기본: true)
}

interface BulkImportResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  duplicates: string[];
  error_details: Array<{
    keyword: string;
    error: string;
  }>;
  by_language: Record<string, {
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
  }>;
}

// =====================================================
// POST HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Parse request body
    const body: BulkImportRequest = await request.json();

    // Validate category if provided
    if (body.category && !SUPPORTED_CATEGORIES.includes(body.category)) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        `지원하지 않는 카테고리입니다. 지원 카테고리: ${SUPPORTED_CATEGORIES.join(', ')}`,
        { field: 'category', value: body.category },
        locale
      );
    }

    let keywords: ParsedKeywordV2[] = [];

    // CSV 문자열이 있으면 V2 파서로 파싱
    if (body.csv_content) {
      const parseOptions: CSVParseOptionsV2 = {
        delimiter: body.delimiter,
        defaultCategory: body.category || 'general',
        skipHeader: body.skip_header !== false,
        autoDetectLanguage: body.auto_detect_language !== false,
      };

      const parseResult: CSVParseResultV2 = parseCSVV2(body.csv_content, parseOptions);

      if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
        throw new APIError(
          ErrorCode.VALIDATION_ERROR,
          'CSV 파싱 실패',
          {
            errors: parseResult.errors,
            stats: parseResult.stats,
            format_detected: parseResult.format_detected,
          },
          locale
        );
      }

      keywords = parseResult.data;

      secureLog('info', 'CSV parsed (V2)', {
        stats: parseResult.stats,
        errorCount: parseResult.errors.length,
        format: parseResult.format_detected,
        by_language: parseResult.stats.by_language,
      });
    }
    // 또는 직접 키워드 배열이 제공된 경우
    else if (body.keywords && Array.isArray(body.keywords)) {
      keywords = body.keywords.map(k => ({
        ...k,
        language: k.language || body.locale || 'en',
        category: k.category || body.category || 'general',
        priority: k.priority || calculatePriority(k.search_volume, k.competition),
      }));
    }
    else {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'csv_content 또는 keywords 배열이 필요합니다.',
        undefined,
        locale
      );
    }

    if (keywords.length === 0) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        '등록할 키워드가 없습니다.',
        undefined,
        locale
      );
    }

    // 최대 등록 개수 제한
    const MAX_BULK_SIZE = 500;
    if (keywords.length > MAX_BULK_SIZE) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        `한 번에 최대 ${MAX_BULK_SIZE}개까지 등록 가능합니다. 현재: ${keywords.length}개`,
        { max: MAX_BULK_SIZE, current: keywords.length },
        locale
      );
    }

    secureLog('info', 'Starting bulk import (V2)', {
      keywordCount: keywords.length,
      languageDistribution: keywords.reduce((acc, k) => {
        acc[k.language] = (acc[k.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      category: body.category,
      userId: user.id,
    });

    // 기존 키워드 조회 (중복 체크용) - 모든 언어 대상
    const allLanguages = [...new Set(keywords.map(k => k.language))];
    const keywordTexts = keywords.map(k => k.keyword.toLowerCase());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingKeywords } = await (adminSupabase.from('content_keywords') as any)
      .select('id, keyword, keyword_native, locale')
      .in('locale', allLanguages)
      .or(`keyword.in.(${keywordTexts.map(k => `"${k}"`).join(',')}),keyword_native.in.(${keywordTexts.map(k => `"${k}"`).join(',')})`);

    const existingMap = new Map<string, { id: string; keyword: string }>();
    if (existingKeywords) {
      for (const ek of existingKeywords) {
        const key1 = `${ek.locale}:${(ek.keyword || '').toLowerCase()}`;
        const key2 = `${ek.locale}:${(ek.keyword_native || '').toLowerCase()}`;
        existingMap.set(key1, { id: ek.id, keyword: ek.keyword });
        existingMap.set(key2, { id: ek.id, keyword: ek.keyword_native });
      }
    }

    // 결과 추적 (전체 + 언어별)
    const result: BulkImportResult = {
      total: keywords.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      duplicates: [],
      error_details: [],
      by_language: {},
    };

    // 언어별 통계 초기화
    for (const lang of allLanguages) {
      result.by_language[lang] = {
        total: keywords.filter(k => k.language === lang).length,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
      };
    }

    // 배치 처리
    const toInsert: Array<Record<string, unknown>> = [];
    const toUpdate: Array<{ id: string; data: Record<string, unknown>; language: Locale }> = [];

    for (const kw of keywords) {
      const lookupKey = `${kw.language}:${kw.keyword.toLowerCase()}`;
      const existing = existingMap.get(lookupKey);

      if (existing) {
        // 기존 키워드 존재
        if (body.update_existing) {
          // 업데이트 모드
          toUpdate.push({
            id: existing.id,
            language: kw.language,
            data: {
              keyword_ko: kw.keyword_ko || kw.keyword,
              search_volume: kw.search_volume,
              competition: kw.competition,
              priority: kw.priority,
              category: kw.category || body.category || 'general',
              updated_at: new Date().toISOString(),
            },
          });
        } else if (body.skip_duplicates !== false) {
          // 스킵 모드 (기본값)
          result.duplicates.push(kw.keyword);
          result.skipped++;
          result.by_language[kw.language].skipped++;
        } else {
          // 에러 모드
          result.error_details.push({
            keyword: kw.keyword,
            error: '이미 존재하는 키워드입니다.',
          });
          result.errors++;
          result.by_language[kw.language].errors++;
        }
      } else {
        // 새 키워드
        toInsert.push({
          keyword: kw.keyword,
          keyword_native: kw.keyword_native || kw.keyword,
          keyword_ko: kw.keyword_ko || kw.keyword,
          locale: kw.language,
          target_locale: kw.language,
          category: kw.category || body.category || 'general',
          search_volume: kw.search_volume,
          competition: kw.competition,
          priority: kw.priority || calculatePriority(kw.search_volume, kw.competition),
          status: 'pending',
          language: kw.language, // Store for post-insert tracking
        });
      }
    }

    // 일괄 삽입 - adminSupabase 사용 (RLS 우회)
    if (toInsert.length > 0) {
      console.log('[BULK API V2] Attempting to insert', toInsert.length, 'keywords');
      console.log('[BULK API V2] First item:', JSON.stringify(toInsert[0], null, 2));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error: insertError } = await (adminSupabase.from('content_keywords') as any)
        .insert(toInsert.map(({ language, ...rest }) => rest)) // Remove tracking field
        .select('id, keyword, locale');

      console.log('[BULK API V2] Insert result - data:', inserted?.length, 'error:', insertError?.message);

      if (insertError) {
        secureLog('error', 'Bulk insert error (V2)', {
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
        });

        // 개별 삽입 시도 (배치 실패 시 fallback)
        for (const item of toInsert) {
          const { language, ...itemData } = item;
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: singleError } = await (adminSupabase.from('content_keywords') as any)
              .insert(itemData);

            if (singleError) {
              result.error_details.push({
                keyword: item.keyword as string,
                error: singleError.message,
              });
              result.errors++;
              result.by_language[language as Locale].errors++;
            } else {
              result.inserted++;
              result.by_language[language as Locale].inserted++;
            }
          } catch (e) {
            result.error_details.push({
              keyword: item.keyword as string,
              error: e instanceof Error ? e.message : 'Unknown error',
            });
            result.errors++;
            result.by_language[language as Locale].errors++;
          }
        }
      } else {
        result.inserted = inserted?.length || toInsert.length;

        // Update language-specific stats
        for (const item of toInsert) {
          result.by_language[item.language as Locale].inserted++;
        }
      }
    }

    // 일괄 업데이트 - adminSupabase 사용 (RLS 우회)
    if (toUpdate.length > 0) {
      for (const update of toUpdate) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (adminSupabase.from('content_keywords') as any)
            .update(update.data)
            .eq('id', update.id);

          if (updateError) {
            result.error_details.push({
              keyword: update.id,
              error: updateError.message,
            });
            result.errors++;
            result.by_language[update.language].errors++;
          } else {
            result.updated++;
            result.by_language[update.language].updated++;
          }
        } catch (e) {
          result.error_details.push({
            keyword: update.id,
            error: e instanceof Error ? e.message : 'Unknown error',
          });
          result.errors++;
          result.by_language[update.language].errors++;
        }
      }
    }

    secureLog('info', 'Bulk import completed (V2)', {
      result,
      userId: user.id,
    });

    // Generate detailed message
    let message = `총 ${result.total}개 중 ${result.inserted}개 등록`;
    if (result.updated > 0) message += `, ${result.updated}개 업데이트`;
    if (result.skipped > 0) message += `, ${result.skipped}개 스킵`;
    if (result.errors > 0) message += `, ${result.errors}개 에러`;

    // Add language breakdown
    const langBreakdown = Object.entries(result.by_language)
      .map(([lang, stats]) => `${lang}: ${stats.inserted}개`)
      .join(', ');
    message += ` | 언어별: ${langBreakdown}`;

    return createSuccessResponse({
      success: result.errors === 0,
      data: result,
      message,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// =====================================================
// GET HANDLER - Template Download
// =====================================================

/**
 * GET /api/keywords/bulk/template
 * CSV 템플릿 다운로드 (V2 포맷 또는 레거시)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get('locale') || 'en') as Locale;
  const format = searchParams.get('format') || 'v2'; // 'v2' or 'legacy'

  let template: string;
  let filename: string;

  if (format === 'legacy') {
    template = generateLegacyTemplate(locale);
    filename = `keyword-template-legacy-${locale}.csv`;
  } else {
    template = generateCSVTemplateV2(true);
    filename = `keyword-template-v2.csv`;
  }

  return new Response(template, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
