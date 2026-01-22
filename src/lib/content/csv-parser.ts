/**
 * CSV Parser for Keyword Bulk Import
 *
 * Expected Format:
 * 키워드(현지어)|키워드(한국어)|검색량
 *
 * Example:
 * rhinoplasty korea cost|코성형 한국 비용|2400
 * 韓国 鼻整形 費用|코성형 한국 비용|1800
 */

import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

export interface ParsedKeyword {
  keyword_native: string;     // 현지어 키워드
  keyword_ko: string;         // 한국어 키워드
  search_volume: number | null;
  locale: Locale;
  category?: string;
}

export interface CSVParseResult {
  success: boolean;
  data: ParsedKeyword[];
  errors: CSVParseError[];
  stats: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    duplicates_in_file: number;
  };
}

export interface CSVParseError {
  row: number;
  column?: string;
  value?: string;
  message: string;
}

export interface CSVParseOptions {
  delimiter?: string;         // 구분자 (기본: |)
  locale: Locale;             // 타겟 로케일
  category?: string;          // 기본 카테고리
  skipHeader?: boolean;       // 첫 행 스킵 여부
  validateSearchVolume?: boolean; // 검색량 필수 여부
}

// =====================================================
// LOCALE DETECTION
// =====================================================

const LOCALE_PATTERNS: Record<Locale, RegExp[]> = {
  'en': [/^[a-zA-Z0-9\s\-'",.:;!?()]+$/],
  'ko': [/[\uac00-\ud7af]/, /[\u1100-\u11ff]/],      // 한국어
  'zh-TW': [/[\u4e00-\u9fff]/, /[\u3400-\u4dbf]/],  // 번체 중국어
  'zh-CN': [/[\u4e00-\u9fff]/],                       // 간체 중국어
  'ja': [/[\u3040-\u309f]/, /[\u30a0-\u30ff]/, /[\u4e00-\u9fff]/], // 히라가나, 가타카나, 한자
  'th': [/[\u0e00-\u0e7f]/],                          // 태국어
  'mn': [/[\u1800-\u18af]/, /[а-яА-ЯёЁөӨүҮ]/],      // 몽골어 (키릴 문자 포함)
  'ru': [/[а-яА-ЯёЁ]/],                               // 러시아어
};

/**
 * 텍스트의 로케일 자동 감지
 */
export function detectLocale(text: string): Locale | null {
  const trimmed = text.trim();

  // 일본어 체크 (히라가나/가타카나 포함 시)
  if (/[\u3040-\u309f]/.test(trimmed) || /[\u30a0-\u30ff]/.test(trimmed)) {
    return 'ja';
  }

  // 태국어 체크
  if (/[\u0e00-\u0e7f]/.test(trimmed)) {
    return 'th';
  }

  // 러시아어 체크
  if (/[а-яА-ЯёЁ]/.test(trimmed) && !/[өӨүҮ]/.test(trimmed)) {
    return 'ru';
  }

  // 몽골어 체크 (키릴 + 특수 문자)
  if (/[өӨүҮ]/.test(trimmed) || /[\u1800-\u18af]/.test(trimmed)) {
    return 'mn';
  }

  // 중국어 체크 (번체/간체 구분은 복잡하므로 기본 zh-CN)
  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    // 번체 특수 문자 확인
    if (/[繁體醫療學習說話國語時間電話銀行機場]/u.test(trimmed)) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }

  // 영어 체크 (ASCII 기반)
  if (/^[a-zA-Z0-9\s\-'",.:;!?()]+$/.test(trimmed)) {
    return 'en';
  }

  return null;
}

// =====================================================
// CSV PARSING
// =====================================================

/**
 * CSV 문자열 파싱
 */
export function parseCSV(
  csvContent: string,
  options: CSVParseOptions
): CSVParseResult {
  const {
    delimiter = '|',
    locale,
    category,
    skipHeader = true,
    validateSearchVolume = false,
  } = options;

  const errors: CSVParseError[] = [];
  const data: ParsedKeyword[] = [];
  const seenKeywords = new Set<string>();
  let duplicatesInFile = 0;

  // 줄 단위로 분리
  const lines = csvContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: 'CSV 파일이 비어있습니다.' }],
      stats: {
        total_rows: 0,
        valid_rows: 0,
        invalid_rows: 0,
        duplicates_in_file: 0,
      },
    };
  }

  // 시작 인덱스 (헤더 스킵 여부)
  const startIndex = skipHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const rowNumber = i + 1; // 1-based row number

    // 주석 처리 (#으로 시작하는 줄 스킵)
    if (line.startsWith('#')) {
      continue;
    }

    // 구분자로 분리
    const parts = line.split(delimiter).map(p => p.trim());

    // 최소 2개 컬럼 필요 (현지어, 한국어)
    if (parts.length < 2) {
      errors.push({
        row: rowNumber,
        message: `최소 2개 컬럼 필요 (현지어|한국어). 현재: ${parts.length}개`,
        value: line,
      });
      continue;
    }

    const [keyword_native, keyword_ko, search_volume_str] = parts;

    // 현지어 키워드 검증
    if (!keyword_native || keyword_native.length === 0) {
      errors.push({
        row: rowNumber,
        column: 'keyword_native',
        message: '현지어 키워드가 비어있습니다.',
      });
      continue;
    }

    // 한국어 키워드 검증
    if (!keyword_ko || keyword_ko.length === 0) {
      errors.push({
        row: rowNumber,
        column: 'keyword_ko',
        message: '한국어 키워드가 비어있습니다.',
      });
      continue;
    }

    // 검색량 파싱
    let search_volume: number | null = null;
    if (search_volume_str) {
      const parsed = parseInt(search_volume_str.replace(/,/g, ''), 10);
      if (isNaN(parsed)) {
        if (validateSearchVolume) {
          errors.push({
            row: rowNumber,
            column: 'search_volume',
            value: search_volume_str,
            message: '검색량이 유효한 숫자가 아닙니다.',
          });
          continue;
        }
      } else {
        search_volume = parsed;
      }
    } else if (validateSearchVolume) {
      errors.push({
        row: rowNumber,
        column: 'search_volume',
        message: '검색량이 필요합니다.',
      });
      continue;
    }

    // 파일 내 중복 체크
    const duplicateKey = `${locale}:${keyword_native.toLowerCase()}`;
    if (seenKeywords.has(duplicateKey)) {
      duplicatesInFile++;
      errors.push({
        row: rowNumber,
        column: 'keyword_native',
        value: keyword_native,
        message: '파일 내 중복 키워드입니다.',
      });
      continue;
    }
    seenKeywords.add(duplicateKey);

    // 유효한 키워드 추가
    data.push({
      keyword_native,
      keyword_ko,
      search_volume,
      locale,
      category,
    });
  }

  const totalRows = lines.length - (skipHeader ? 1 : 0);

  return {
    success: errors.length === 0,
    data,
    errors,
    stats: {
      total_rows: totalRows,
      valid_rows: data.length,
      invalid_rows: errors.length,
      duplicates_in_file: duplicatesInFile,
    },
  };
}

/**
 * 파일에서 CSV 파싱 (브라우저용)
 */
export async function parseCSVFile(
  file: File,
  options: CSVParseOptions
): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        resolve({
          success: false,
          data: [],
          errors: [{ row: 0, message: '파일을 읽을 수 없습니다.' }],
          stats: {
            total_rows: 0,
            valid_rows: 0,
            invalid_rows: 0,
            duplicates_in_file: 0,
          },
        });
        return;
      }
      resolve(parseCSV(content, options));
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

// =====================================================
// VALIDATION UTILITIES
// =====================================================

/**
 * 키워드 유효성 검증
 */
export function validateKeyword(keyword: string): { valid: boolean; error?: string } {
  if (!keyword || keyword.trim().length === 0) {
    return { valid: false, error: '키워드가 비어있습니다.' };
  }

  if (keyword.length > 200) {
    return { valid: false, error: '키워드가 너무 깁니다. (최대 200자)' };
  }

  // 특수 문자만 있는 경우
  if (/^[\s\-_.,;:!?'"]+$/.test(keyword)) {
    return { valid: false, error: '유효한 키워드가 아닙니다.' };
  }

  return { valid: true };
}

/**
 * CSV 데이터 미리보기 생성
 */
export function generatePreview(
  data: ParsedKeyword[],
  limit: number = 10
): ParsedKeyword[] {
  return data.slice(0, limit);
}

/**
 * CSV 템플릿 생성
 */
export function generateCSVTemplate(locale: Locale): string {
  const headers = '키워드(현지어)|키워드(한국어)|검색량';
  const examples: Record<Locale, string[]> = {
    'en': [
      'rhinoplasty korea cost|코성형 한국 비용|2400',
      'best plastic surgery korea|한국 최고 성형외과|1800',
      'gangnam clinic|강남 클리닉|1200',
    ],
    'ko': [
      '강남 성형외과 추천|강남 성형외과 추천|2000',
      '코성형 잘하는 병원|코성형 잘하는 병원|1500',
      '서울 피부과 추천|서울 피부과 추천|1200',
    ],
    'zh-TW': [
      '韓國整形費用|한국 성형 비용|1500',
      '首爾醫美診所|서울 의료미용 클리닉|1200',
      '韓國鼻整形|한국 코성형|900',
    ],
    'zh-CN': [
      '韩国整形价格|한국 성형 가격|2000',
      '首尔医美医院|서울 의료미용 병원|1600',
      '韩国双眼皮手术|한국 쌍꺼풀 수술|1100',
    ],
    'ja': [
      '韓国美容整形|한국 미용성형|1800',
      '韓国クリニック費用|한국 클리닉 비용|1400',
      '江南美容外科|강남 미용외과|1000',
    ],
    'th': [
      'ศัลยกรรมเกาหลี|한국 성형수술|1200',
      'คลินิกเกาหลีราคา|한국 클리닉 가격|900',
      'ทำจมูกเกาหลี|한국 코성형|700',
    ],
    'mn': [
      'Солонгос гоо сайхан|한국 미용|600',
      'Сөүл эмнэлэг|서울 병원|450',
      'Гоо сайхны мэс засал|미용 수술|350',
    ],
    'ru': [
      'пластика в Корее цена|한국 성형 가격|1000',
      'клиника в Сеуле|서울 클리닉|800',
      'ринопластика Корея|한국 코성형|600',
    ],
  };

  const exampleLines = examples[locale] || examples['en'];
  return [headers, ...exampleLines].join('\n');
}

// =====================================================
// EXPORT UTILITIES
// =====================================================

/**
 * 키워드 데이터를 CSV로 내보내기
 */
export function exportToCSV(keywords: ParsedKeyword[]): string {
  const header = '키워드(현지어)|키워드(한국어)|검색량|로케일|카테고리';
  const rows = keywords.map(k =>
    [
      k.keyword_native,
      k.keyword_ko,
      k.search_volume ?? '',
      k.locale,
      k.category ?? '',
    ].join('|')
  );
  return [header, ...rows].join('\n');
}

/**
 * 에러 리포트 생성
 */
export function generateErrorReport(errors: CSVParseError[]): string {
  if (errors.length === 0) {
    return '에러가 없습니다.';
  }

  const lines = errors.map(err => {
    const parts = [`Row ${err.row}: ${err.message}`];
    if (err.column) parts.push(`Column: ${err.column}`);
    if (err.value) parts.push(`Value: "${err.value}"`);
    return parts.join(' | ');
  });

  return lines.join('\n');
}
