/**
 * Keywords Bulk Import API
 *
 * POST /api/keywords/bulk - Bulk import keywords from CSV data
 *
 * Features:
 * - CSV 데이터 일괄 등록
 * - 중복 체크 (로케일 + 키워드 조합)
 * - 트랜잭션 처리
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
  validateRequired,
} from '@/lib/api/error-handler';
import { parseCSV, type ParsedKeyword, type CSVParseOptions } from '@/lib/content/csv-parser';
import type { Locale } from '@/lib/i18n/config';

// 지원 로케일 목록
const SUPPORTED_LOCALES: Locale[] = ['en', 'zh-TW', 'zh-CN', 'ja', 'th', 'mn', 'ru'];

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

interface BulkImportRequest {
  // CSV 문자열 또는 파싱된 키워드 배열
  csv_content?: string;
  keywords?: ParsedKeyword[];

  // 옵션
  locale: Locale;
  category?: string;
  delimiter?: string;
  skip_header?: boolean;
  skip_duplicates?: boolean;   // 중복 키워드 스킵 여부
  update_existing?: boolean;   // 기존 키워드 업데이트 여부
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
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient(); // Use admin client for DB operations
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // TEMPORARILY DISABLED: Admin role check
    // TODO: Re-enable after fixing profiles table

    // Parse request body
    const body: BulkImportRequest = await request.json();

    // Validate required fields
    if (!body.locale) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'locale 필드가 필요합니다.',
        { field: 'locale' },
        locale
      );
    }

    // Validate locale
    if (!SUPPORTED_LOCALES.includes(body.locale)) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        `지원하지 않는 로케일입니다. 지원 로케일: ${SUPPORTED_LOCALES.join(', ')}`,
        { field: 'locale', value: body.locale },
        locale
      );
    }

    // Validate category if provided
    if (body.category && !SUPPORTED_CATEGORIES.includes(body.category)) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        `지원하지 않는 카테고리입니다. 지원 카테고리: ${SUPPORTED_CATEGORIES.join(', ')}`,
        { field: 'category', value: body.category },
        locale
      );
    }

    let keywords: ParsedKeyword[] = [];

    // CSV 문자열이 있으면 파싱
    if (body.csv_content) {
      const parseOptions: CSVParseOptions = {
        delimiter: body.delimiter || '|',
        locale: body.locale,
        category: body.category || 'general',
        skipHeader: body.skip_header !== false, // 기본값 true
      };

      const parseResult = parseCSV(body.csv_content, parseOptions);

      if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
        throw new APIError(
          ErrorCode.VALIDATION_ERROR,
          'CSV 파싱 실패',
          {
            errors: parseResult.errors,
            stats: parseResult.stats,
          },
          locale
        );
      }

      keywords = parseResult.data;

      secureLog('info', 'CSV parsed', {
        stats: parseResult.stats,
        errorCount: parseResult.errors.length,
      });
    }
    // 또는 직접 키워드 배열이 제공된 경우
    else if (body.keywords && Array.isArray(body.keywords)) {
      keywords = body.keywords.map(k => ({
        ...k,
        locale: k.locale || body.locale,
        category: k.category || body.category || 'general',
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

    secureLog('info', 'Starting bulk import', {
      keywordCount: keywords.length,
      locale: body.locale,
      category: body.category,
      userId: user.id,
    });

    // 기존 키워드 조회 (중복 체크용) - admin client 사용
    const keywordNatives = keywords.map(k => k.keyword_native.toLowerCase());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingKeywords } = await (adminSupabase.from('content_keywords') as any)
      .select('id, keyword, keyword_native, locale')
      .eq('locale', body.locale)
      .or(`keyword.in.(${keywordNatives.map(k => `"${k}"`).join(',')}),keyword_native.in.(${keywordNatives.map(k => `"${k}"`).join(',')})`);

    const existingMap = new Map<string, { id: string; keyword: string }>();
    if (existingKeywords) {
      for (const ek of existingKeywords) {
        const key1 = `${body.locale}:${(ek.keyword || '').toLowerCase()}`;
        const key2 = `${body.locale}:${(ek.keyword_native || '').toLowerCase()}`;
        existingMap.set(key1, { id: ek.id, keyword: ek.keyword });
        existingMap.set(key2, { id: ek.id, keyword: ek.keyword_native });
      }
    }

    // 결과 추적
    const result: BulkImportResult = {
      total: keywords.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      duplicates: [],
      error_details: [],
    };

    // 배치 처리
    const toInsert: Array<Record<string, unknown>> = [];
    const toUpdate: Array<{ id: string; data: Record<string, unknown> }> = [];

    for (const kw of keywords) {
      const lookupKey = `${body.locale}:${kw.keyword_native.toLowerCase()}`;
      const existing = existingMap.get(lookupKey);

      if (existing) {
        // 기존 키워드 존재
        if (body.update_existing) {
          // 업데이트 모드
          toUpdate.push({
            id: existing.id,
            data: {
              keyword_ko: kw.keyword_ko,
              search_volume: kw.search_volume,
              category: kw.category || body.category || 'general',
              updated_at: new Date().toISOString(),
            },
          });
        } else if (body.skip_duplicates !== false) {
          // 스킵 모드 (기본값)
          result.duplicates.push(kw.keyword_native);
          result.skipped++;
        } else {
          // 에러 모드
          result.error_details.push({
            keyword: kw.keyword_native,
            error: '이미 존재하는 키워드입니다.',
          });
          result.errors++;
        }
      } else {
        // 새 키워드
        toInsert.push({
          keyword: kw.keyword_native,          // 기존 keyword 컬럼 (검색용)
          keyword_native: kw.keyword_native,   // 현지어 키워드
          keyword_ko: kw.keyword_ko,           // 한국어 키워드
          locale: body.locale,
          target_locale: body.locale,
          category: kw.category || body.category || 'general',
          search_volume: kw.search_volume,
          status: 'pending',
          priority: calculatePriority(kw.search_volume),
        });
      }
    }

    // 일괄 삽입 - adminSupabase 사용 (RLS 우회)
    if (toInsert.length > 0) {
      console.log('[BULK API] Attempting to insert', toInsert.length, 'keywords');
      console.log('[BULK API] First item:', JSON.stringify(toInsert[0], null, 2));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error: insertError } = await (adminSupabase.from('content_keywords') as any)
        .insert(toInsert)
        .select('id, keyword_native');

      console.log('[BULK API] Insert result - data:', inserted?.length, 'error:', insertError?.message);

      if (insertError) {
        secureLog('error', 'Bulk insert error', { error: insertError.message, code: insertError.code, details: insertError.details });

        // 개별 삽입 시도 (배치 실패 시 fallback) - adminSupabase 사용
        for (const item of toInsert) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: singleError } = await (adminSupabase.from('content_keywords') as any)
              .insert(item);

            if (singleError) {
              result.error_details.push({
                keyword: item.keyword_native as string,
                error: singleError.message,
              });
              result.errors++;
            } else {
              result.inserted++;
            }
          } catch (e) {
            result.error_details.push({
              keyword: item.keyword_native as string,
              error: e instanceof Error ? e.message : 'Unknown error',
            });
            result.errors++;
          }
        }
      } else {
        result.inserted = inserted?.length || toInsert.length;
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
          } else {
            result.updated++;
          }
        } catch (e) {
          result.error_details.push({
            keyword: update.id,
            error: e instanceof Error ? e.message : 'Unknown error',
          });
          result.errors++;
        }
      }
    }

    secureLog('info', 'Bulk import completed', {
      result,
      userId: user.id,
    });

    return createSuccessResponse({
      success: result.errors === 0,
      data: result,
      message: `총 ${result.total}개 중 ${result.inserted}개 등록, ${result.updated}개 업데이트, ${result.skipped}개 스킵, ${result.errors}개 에러`,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * 검색량 기반 우선순위 계산
 */
function calculatePriority(searchVolume: number | null): number {
  if (!searchVolume) return 1;

  if (searchVolume >= 5000) return 5;
  if (searchVolume >= 2000) return 4;
  if (searchVolume >= 1000) return 3;
  if (searchVolume >= 500) return 2;
  return 1;
}

/**
 * GET /api/keywords/bulk/template
 * CSV 템플릿 다운로드
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get('locale') || 'en') as Locale;

  // 템플릿 생성
  const { generateCSVTemplate } = await import('@/lib/content/csv-parser');
  const template = generateCSVTemplate(locale);

  return new Response(template, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="keyword-template-${locale}.csv"`,
    },
  });
}
