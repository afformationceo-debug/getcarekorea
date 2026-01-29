/**
 * CSV Parser V2 for Keyword Bulk Import - Enhanced Version
 *
 * New CSV Format (supports both formats for backward compatibility):
 *
 * Format 1 (Legacy): 키워드(현지어)|키워드(한국어)|검색량
 * Format 2 (Enhanced): keyword,language,search_volume,competition,priority,category
 *
 * Example:
 * keyword,language,search_volume,competition,priority,category
 * 안면윤곽 수술,ko,5000,high,1,plastic-surgery
 * Facial Contouring Surgery,en,3000,medium,1,plastic-surgery
 * 整形手术,zh-CN,2000,low,2,plastic-surgery
 */

import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

export interface ParsedKeywordV2 {
  keyword: string;              // Main keyword
  keyword_native?: string;      // Legacy: native keyword (for backward compatibility)
  keyword_ko?: string;          // Legacy: Korean keyword (for backward compatibility)
  language: Locale;             // Auto-detected or specified language
  search_volume: number | null;
  competition: number | null;   // 1-10 scale
  competition_text?: 'low' | 'medium' | 'high'; // Original text
  priority: number | null;      // 1-10 scale (auto-calculated or specified)
  category: string;
}

export interface CSVParseResultV2 {
  success: boolean;
  data: ParsedKeywordV2[];
  errors: CSVParseError[];
  stats: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    duplicates_in_file: number;
    by_language: Record<string, number>; // Language distribution
  };
  format_detected: 'legacy' | 'enhanced' | 'mixed';
}

export interface CSVParseError {
  row: number;
  column?: string;
  value?: string;
  message: string;
}

export interface CSVParseOptionsV2 {
  delimiter?: string;           // Auto-detect or specify: , or |
  defaultCategory?: string;     // Default category if not specified
  skipHeader?: boolean;         // Skip first row
  validateSearchVolume?: boolean; // Require search volume
  autoDetectLanguage?: boolean; // Auto-detect language from keyword
}

// =====================================================
// LOCALE DETECTION (Enhanced)
// =====================================================

const LOCALE_PATTERNS: Record<Locale, RegExp[]> = {
  'en': [/^[a-zA-Z0-9\s\-'",.:;!?()]+$/],
  'ko': [/[\uac00-\ud7af]/, /[\u1100-\u11ff]/],
  'zh-TW': [/[\u4e00-\u9fff]/, /[\u3400-\u4dbf]/],
  'zh-CN': [/[\u4e00-\u9fff]/],
  'ja': [/[\u3040-\u309f]/, /[\u30a0-\u30ff]/, /[\u4e00-\u9fff]/],
  'th': [/[\u0e00-\u0e7f]/],
  'mn': [/[\u1800-\u18af]/, /[а-яА-ЯёЁөӨүҮ]/],
  'ru': [/[а-яА-ЯёЁ]/],
};

const LOCALE_CODES = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'] as const;

/**
 * Auto-detect locale from text
 */
export function detectLocale(text: string): Locale {
  const trimmed = text.trim();

  // Korean check
  if (/[\uac00-\ud7af]/.test(trimmed)) {
    return 'ko';
  }

  // Japanese check (hiragana/katakana)
  if (/[\u3040-\u309f]/.test(trimmed) || /[\u30a0-\u30ff]/.test(trimmed)) {
    return 'ja';
  }

  // Thai check
  if (/[\u0e00-\u0e7f]/.test(trimmed)) {
    return 'th';
  }

  // Russian check
  if (/[а-яА-ЯёЁ]/.test(trimmed) && !/[өӨүҮ]/.test(trimmed)) {
    return 'ru';
  }

  // Mongolian check
  if (/[өӨүҮ]/.test(trimmed) || /[\u1800-\u18af]/.test(trimmed)) {
    return 'mn';
  }

  // Chinese check
  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    // Traditional vs Simplified (heuristic)
    if (/[繁體醫療學習說話國語時間電話銀行機場]/u.test(trimmed)) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }

  // English (default)
  return 'en';
}

/**
 * Validate locale code
 */
export function isValidLocale(code: string): code is Locale {
  return LOCALE_CODES.includes(code as Locale);
}

// =====================================================
// COMPETITION PARSING
// =====================================================

/**
 * Parse competition level to numeric score (1-10)
 */
export function parseCompetition(value: string): { score: number; text: 'low' | 'medium' | 'high' } | null {
  const normalized = value.toLowerCase().trim();

  // Text-based
  if (normalized === 'low' || normalized === '낮음') {
    return { score: 3, text: 'low' };
  }
  if (normalized === 'medium' || normalized === '중간' || normalized === 'mid') {
    return { score: 6, text: 'medium' };
  }
  if (normalized === 'high' || normalized === '높음') {
    return { score: 9, text: 'high' };
  }

  // Numeric (1-10)
  const num = parseFloat(normalized);
  if (!isNaN(num) && num >= 1 && num <= 10) {
    let text: 'low' | 'medium' | 'high';
    if (num <= 3) text = 'low';
    else if (num <= 7) text = 'medium';
    else text = 'high';
    return { score: Math.round(num), text };
  }

  return null;
}

// =====================================================
// PRIORITY CALCULATION
// =====================================================

/**
 * Calculate priority based on search volume and competition
 * Higher priority = better opportunity (high volume, low competition)
 * Scale: 1-10 (10 = highest priority)
 */
export function calculatePriority(
  searchVolume: number | null,
  competition: number | null
): number {
  // Default priority if no data
  if (!searchVolume && !competition) return 5;

  // Normalize search volume to 1-10 scale
  let volumeScore = 5; // default
  if (searchVolume !== null) {
    if (searchVolume >= 10000) volumeScore = 10;
    else if (searchVolume >= 5000) volumeScore = 9;
    else if (searchVolume >= 2000) volumeScore = 7;
    else if (searchVolume >= 1000) volumeScore = 5;
    else if (searchVolume >= 500) volumeScore = 3;
    else volumeScore = 1;
  }

  // Competition score (inverse: lower competition = higher score)
  const compScore = competition !== null ? (11 - competition) : 5;

  // Weighted average (60% volume, 40% competition)
  const priority = Math.round(volumeScore * 0.6 + compScore * 0.4);

  return Math.max(1, Math.min(10, priority));
}

// =====================================================
// FORMAT DETECTION
// =====================================================

/**
 * Detect CSV format (legacy or enhanced)
 */
export function detectCSVFormat(firstLine: string): { format: 'legacy' | 'enhanced'; delimiter: string } {
  const hasPipe = firstLine.includes('|');
  const hasComma = firstLine.includes(',');

  // Check header keywords
  const lowerLine = firstLine.toLowerCase();
  const hasEnhancedHeaders =
    lowerLine.includes('keyword') ||
    lowerLine.includes('language') ||
    lowerLine.includes('competition');

  if (hasEnhancedHeaders && hasComma) {
    return { format: 'enhanced', delimiter: ',' };
  }

  if (hasPipe) {
    return { format: 'legacy', delimiter: '|' };
  }

  // Default to enhanced with comma
  return { format: 'enhanced', delimiter: ',' };
}

// =====================================================
// CSV PARSING
// =====================================================

/**
 * Parse CSV with auto-format detection
 */
export function parseCSVV2(
  csvContent: string,
  options: CSVParseOptionsV2 = {}
): CSVParseResultV2 {
  const {
    delimiter,
    defaultCategory = 'general',
    skipHeader = true,
    validateSearchVolume = false,
    autoDetectLanguage = true,
  } = options;

  const errors: CSVParseError[] = [];
  const data: ParsedKeywordV2[] = [];
  const seenKeywords = new Set<string>();
  let duplicatesInFile = 0;
  const languageStats: Record<string, number> = {};

  // Split lines
  const lines = csvContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

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
        by_language: {},
      },
      format_detected: 'enhanced',
    };
  }

  // Detect format from first line
  const { format: detectedFormat, delimiter: detectedDelimiter } = detectCSVFormat(lines[0]);
  const actualDelimiter = delimiter || detectedDelimiter;

  // Parse header if enhanced format
  const columnMap: Record<string, number> = {};
  let startIndex = 0;

  if (detectedFormat === 'enhanced' && skipHeader) {
    const headerLine = lines[0];
    const headers = headerLine.split(actualDelimiter).map(h => h.trim().toLowerCase());

    // Build column map
    headers.forEach((header, index) => {
      columnMap[header] = index;
    });

    startIndex = 1;
  } else if (detectedFormat === 'legacy') {
    startIndex = skipHeader ? 1 : 0;
  }

  // Parse data rows
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const rowNumber = i + 1;

    const parts = line.split(actualDelimiter).map(p => p.trim());

    try {
      let parsed: ParsedKeywordV2;

      if (detectedFormat === 'enhanced') {
        // Enhanced format: keyword,language,search_volume,competition,priority,category
        const keyword = parts[columnMap['keyword'] ?? 0] || '';
        const languageRaw = parts[columnMap['language'] ?? 1] || '';
        const searchVolumeRaw = parts[columnMap['search_volume'] ?? 2] || '';
        const competitionRaw = parts[columnMap['competition'] ?? 3] || '';
        const priorityRaw = parts[columnMap['priority'] ?? 4] || '';
        const category = parts[columnMap['category'] ?? 5] || defaultCategory;

        // Validate keyword
        if (!keyword) {
          errors.push({
            row: rowNumber,
            column: 'keyword',
            message: '키워드가 비어있습니다.',
          });
          continue;
        }

        // Parse/detect language
        let language: Locale;
        if (languageRaw && isValidLocale(languageRaw)) {
          language = languageRaw as Locale;
        } else if (autoDetectLanguage) {
          language = detectLocale(keyword);
        } else {
          errors.push({
            row: rowNumber,
            column: 'language',
            value: languageRaw,
            message: '유효하지 않은 언어 코드입니다. (ko, en, ja, zh-CN, zh-TW, th, mn, ru)',
          });
          continue;
        }

        // Parse search volume
        let search_volume: number | null = null;
        if (searchVolumeRaw) {
          const parsed = parseInt(searchVolumeRaw.replace(/,/g, ''), 10);
          if (isNaN(parsed)) {
            if (validateSearchVolume) {
              errors.push({
                row: rowNumber,
                column: 'search_volume',
                value: searchVolumeRaw,
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

        // Parse competition
        let competition: number | null = null;
        let competition_text: 'low' | 'medium' | 'high' | undefined;
        if (competitionRaw) {
          const compResult = parseCompetition(competitionRaw);
          if (compResult) {
            competition = compResult.score;
            competition_text = compResult.text;
          }
        }

        // Parse or calculate priority
        let priority: number | null = null;
        if (priorityRaw) {
          const parsed = parseInt(priorityRaw, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
            priority = parsed;
          }
        }
        if (priority === null) {
          priority = calculatePriority(search_volume, competition);
        }

        // Check duplicates
        const duplicateKey = `${language}:${keyword.toLowerCase()}`;
        if (seenKeywords.has(duplicateKey)) {
          duplicatesInFile++;
          errors.push({
            row: rowNumber,
            column: 'keyword',
            value: keyword,
            message: '파일 내 중복 키워드입니다.',
          });
          continue;
        }
        seenKeywords.add(duplicateKey);

        parsed = {
          keyword,
          language,
          search_volume,
          competition,
          competition_text,
          priority,
          category,
        };

        // Update language stats
        languageStats[language] = (languageStats[language] || 0) + 1;

        data.push(parsed);
      } else {
        // Legacy format: 현지어|한국어|검색량
        if (parts.length < 2) {
          errors.push({
            row: rowNumber,
            message: `최소 2개 컬럼 필요 (현지어|한국어). 현재: ${parts.length}개`,
            value: line,
          });
          continue;
        }

        const [keyword_native, keyword_ko, search_volume_str] = parts;

        if (!keyword_native || !keyword_ko) {
          errors.push({
            row: rowNumber,
            message: '키워드가 비어있습니다.',
          });
          continue;
        }

        // Auto-detect language
        const language = autoDetectLanguage ? detectLocale(keyword_native) : 'en';

        // Parse search volume
        let search_volume: number | null = null;
        if (search_volume_str) {
          const parsed = parseInt(search_volume_str.replace(/,/g, ''), 10);
          if (!isNaN(parsed)) {
            search_volume = parsed;
          }
        }

        // Calculate priority
        const priority = calculatePriority(search_volume, null);

        // Check duplicates
        const duplicateKey = `${language}:${keyword_native.toLowerCase()}`;
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

        parsed = {
          keyword: keyword_native,
          keyword_native,
          keyword_ko,
          language,
          search_volume,
          competition: null,
          priority,
          category: defaultCategory,
        };

        // Update language stats
        languageStats[language] = (languageStats[language] || 0) + 1;

        data.push(parsed);
      }
    } catch (e) {
      errors.push({
        row: rowNumber,
        message: e instanceof Error ? e.message : 'Unknown error',
        value: line,
      });
    }
  }

  const totalRows = lines.length - startIndex;

  return {
    success: errors.length === 0 || data.length > 0,
    data,
    errors,
    stats: {
      total_rows: totalRows,
      valid_rows: data.length,
      invalid_rows: errors.length,
      duplicates_in_file: duplicatesInFile,
      by_language: languageStats,
    },
    format_detected: detectedFormat,
  };
}

// =====================================================
// TEMPLATE GENERATION
// =====================================================

/**
 * Generate CSV template (enhanced format)
 */
export function generateCSVTemplateV2(includeExamples: boolean = true): string {
  const header = 'keyword,language,search_volume,competition,priority,category';

  if (!includeExamples) {
    return header;
  }

  const examples = [
    '안면윤곽 수술,ko,5000,high,,plastic-surgery',
    'Facial Contouring Surgery,en,3000,medium,,plastic-surgery',
    '整形手术,zh-CN,2000,low,,plastic-surgery',
    '美容整形,ja,1500,medium,,plastic-surgery',
    'ศัลยกรรมเกาหลี,th,1000,low,,plastic-surgery',
    '# 참고: language는 자동 감지 가능 (비워두면 자동)',
    '# competition: low/medium/high 또는 1-10 숫자',
    '# priority: 1-10 (비워두면 자동 계산)',
  ];

  return [header, ...examples].join('\n');
}

/**
 * Generate legacy template (backward compatibility)
 */
export function generateLegacyTemplate(locale: Locale): string {
  const header = '키워드(현지어)|키워드(한국어)|검색량';
  const examples: Record<Locale, string[]> = {
    'en': [
      'rhinoplasty korea cost|코성형 한국 비용|2400',
      'best plastic surgery korea|한국 최고 성형외과|1800',
    ],
    'ko': [
      '강남 성형외과 추천|강남 성형외과 추천|2000',
      '코성형 잘하는 병원|코성형 잘하는 병원|1500',
    ],
    'zh-CN': [
      '韩国整形价格|한국 성형 가격|2000',
      '首尔医美医院|서울 의료미용 병원|1600',
    ],
    'zh-TW': [
      '韓國整形費用|한국 성형 비용|1500',
      '首爾醫美診所|서울 의료미용 클리닉|1200',
    ],
    'ja': [
      '韓国美容整形|한국 미용성형|1800',
      '韓国クリニック費用|한국 클리닉 비용|1400',
    ],
    'th': [
      'ศัลยกรรมเกาหลี|한국 성형수술|1200',
      'คลินิกเกาหลีราคา|한국 클리닉 가격|900',
    ],
    'mn': [
      'Солонгос гоо сайхан|한국 미용|600',
      'Сөүл эмнэлэг|서울 병원|450',
    ],
    'ru': [
      'пластика в Корее цена|한국 성형 가격|1000',
      'клиника в Сеуле|서울 클리닉|800',
    ],
  };

  const exampleLines = examples[locale] || examples['en'];
  return [header, ...exampleLines].join('\n');
}

// =====================================================
// EXPORT UTILITIES
// =====================================================

/**
 * Export keywords to CSV (enhanced format)
 */
export function exportToCSVV2(keywords: ParsedKeywordV2[]): string {
  const header = 'keyword,language,search_volume,competition,priority,category';
  const rows = keywords.map(k =>
    [
      k.keyword,
      k.language,
      k.search_volume ?? '',
      k.competition_text || k.competition || '',
      k.priority ?? '',
      k.category,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

/**
 * Generate error report
 */
export function generateErrorReportV2(errors: CSVParseError[]): string {
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

/**
 * Generate language statistics report
 */
export function generateLanguageStats(stats: Record<string, number>): string {
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

  const lines = Object.entries(stats)
    .sort(([, a], [, b]) => b - a) // Sort by count descending
    .map(([lang, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      return `${lang}: ${count}개 (${percentage}%)`;
    });

  return [`총 ${total}개`, ...lines].join('\n');
}
