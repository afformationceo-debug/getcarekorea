/**
 * Content Quality Scoring System
 *
 * Automatically evaluates and scores generated content
 * based on multiple quality factors.
 */

// =====================================================
// TYPES
// =====================================================

export interface QualityScoreResult {
  overallScore: number;
  breakdown: {
    readability: number;
    seoOptimization: number;
    contentDepth: number;
    structure: number;
    engagement: number;
    uniqueness: number;
  };
  suggestions: QualitySuggestion[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface QualitySuggestion {
  category: keyof QualityScoreResult['breakdown'];
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

export interface ContentInput {
  title: string;
  content: string;
  excerpt?: string;
  metaDescription?: string;
  targetKeyword: string;
  targetLocale: string;
  category?: string;
  tags?: string[];
}

// =====================================================
// CONSTANTS
// =====================================================

// Weight for each quality factor (total = 100%)
const QUALITY_WEIGHTS = {
  readability: 0.20,
  seoOptimization: 0.25,
  contentDepth: 0.20,
  structure: 0.15,
  engagement: 0.10,
  uniqueness: 0.10,
};

// Grade thresholds
const GRADE_THRESHOLDS = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
  F: 0,
};

// Content length recommendations by locale
const CONTENT_LENGTH_TARGETS: Record<string, { min: number; ideal: number; max: number }> = {
  en: { min: 800, ideal: 1500, max: 3000 },
  ko: { min: 600, ideal: 1200, max: 2500 },
  ja: { min: 600, ideal: 1200, max: 2500 },
  'zh-CN': { min: 500, ideal: 1000, max: 2000 },
  'zh-TW': { min: 500, ideal: 1000, max: 2000 },
  th: { min: 600, ideal: 1200, max: 2500 },
  mn: { min: 500, ideal: 1000, max: 2000 },
  ru: { min: 700, ideal: 1400, max: 2800 },
};

// Common words that don't count for keyword analysis
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
  'it', 'its', 'they', 'their', 'we', 'our', 'you', 'your',
]);

// =====================================================
// MAIN FUNCTION
// =====================================================

export function calculateQualityScore(input: ContentInput): QualityScoreResult {
  const suggestions: QualitySuggestion[] = [];

  // Calculate individual scores
  const readability = calculateReadabilityScore(input, suggestions);
  const seoOptimization = calculateSEOScore(input, suggestions);
  const contentDepth = calculateContentDepthScore(input, suggestions);
  const structure = calculateStructureScore(input, suggestions);
  const engagement = calculateEngagementScore(input, suggestions);
  const uniqueness = calculateUniquenessScore(input, suggestions);

  // Calculate weighted overall score
  const overallScore = Math.round(
    readability * QUALITY_WEIGHTS.readability +
    seoOptimization * QUALITY_WEIGHTS.seoOptimization +
    contentDepth * QUALITY_WEIGHTS.contentDepth +
    structure * QUALITY_WEIGHTS.structure +
    engagement * QUALITY_WEIGHTS.engagement +
    uniqueness * QUALITY_WEIGHTS.uniqueness
  );

  // Determine grade
  let grade: QualityScoreResult['grade'] = 'F';
  if (overallScore >= GRADE_THRESHOLDS.A) grade = 'A';
  else if (overallScore >= GRADE_THRESHOLDS.B) grade = 'B';
  else if (overallScore >= GRADE_THRESHOLDS.C) grade = 'C';
  else if (overallScore >= GRADE_THRESHOLDS.D) grade = 'D';

  // Sort suggestions by severity
  suggestions.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return {
    overallScore,
    breakdown: {
      readability,
      seoOptimization,
      contentDepth,
      structure,
      engagement,
      uniqueness,
    },
    suggestions: suggestions.slice(0, 10), // Top 10 suggestions
    grade,
  };
}

// =====================================================
// SCORING FUNCTIONS
// =====================================================

/**
 * Calculate readability score (0-100)
 * Factors: sentence length, word complexity, paragraph structure
 */
function calculateReadabilityScore(
  input: ContentInput,
  suggestions: QualitySuggestion[]
): number {
  const { content, targetLocale } = input;
  let score = 100;

  // Get sentences
  const sentences = content.split(/[.!?。！？]/g).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;

  // Check sentence length (ideal: 15-20 words for English, adjusted for other languages)
  const idealSentenceLength = targetLocale === 'en' ? 17 : 12;
  if (avgSentenceLength > idealSentenceLength + 10) {
    score -= 15;
    suggestions.push({
      category: 'readability',
      severity: 'medium',
      message: '문장 길이가 너무 깁니다',
      recommendation: '문장을 더 짧게 나누어 가독성을 높이세요',
    });
  } else if (avgSentenceLength < idealSentenceLength - 8) {
    score -= 10;
    suggestions.push({
      category: 'readability',
      severity: 'low',
      message: '문장이 너무 짧습니다',
      recommendation: '일부 문장을 결합하여 더 자연스러운 흐름을 만드세요',
    });
  }

  // Check paragraph length
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const avgParagraphLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;

  if (avgParagraphLength > 500) {
    score -= 10;
    suggestions.push({
      category: 'readability',
      severity: 'medium',
      message: '단락이 너무 깁니다',
      recommendation: '긴 단락을 여러 개의 짧은 단락으로 나누세요',
    });
  }

  // Check for complex words (words > 12 characters)
  const words = content.split(/\s+/);
  const complexWords = words.filter(w => w.length > 12).length;
  const complexRatio = complexWords / words.length;

  if (complexRatio > 0.1) {
    score -= 10;
    suggestions.push({
      category: 'readability',
      severity: 'low',
      message: '복잡한 용어가 많습니다',
      recommendation: '전문 용어에 대한 설명을 추가하거나 쉬운 단어로 대체하세요',
    });
  }

  return Math.max(0, score);
}

/**
 * Calculate SEO optimization score (0-100)
 * Factors: keyword usage, meta data, headings, links
 */
function calculateSEOScore(
  input: ContentInput,
  suggestions: QualitySuggestion[]
): number {
  const { title, content, excerpt, metaDescription, targetKeyword, tags } = input;
  let score = 100;

  const keywordLower = targetKeyword.toLowerCase();
  const contentLower = content.toLowerCase();
  const titleLower = title.toLowerCase();

  // Check keyword in title
  if (!titleLower.includes(keywordLower)) {
    score -= 15;
    suggestions.push({
      category: 'seoOptimization',
      severity: 'high',
      message: '제목에 타겟 키워드가 없습니다',
      recommendation: `제목에 "${targetKeyword}" 키워드를 포함시키세요`,
    });
  }

  // Check title length (50-60 characters ideal)
  if (title.length < 30) {
    score -= 10;
    suggestions.push({
      category: 'seoOptimization',
      severity: 'medium',
      message: '제목이 너무 짧습니다',
      recommendation: '50-60자 사이의 제목을 작성하세요',
    });
  } else if (title.length > 70) {
    score -= 5;
    suggestions.push({
      category: 'seoOptimization',
      severity: 'low',
      message: '제목이 너무 깁니다',
      recommendation: '검색 결과에서 잘리지 않도록 60자 이내로 줄이세요',
    });
  }

  // Check keyword density (1-3% ideal)
  const words = contentLower.split(/\s+/);
  const keywordCount = words.filter(w =>
    w.includes(keywordLower) || keywordLower.split(' ').some(kw => w.includes(kw))
  ).length;
  const keywordDensity = (keywordCount / words.length) * 100;

  if (keywordDensity < 0.5) {
    score -= 15;
    suggestions.push({
      category: 'seoOptimization',
      severity: 'high',
      message: '키워드 밀도가 너무 낮습니다',
      recommendation: `"${targetKeyword}" 키워드를 본문에 더 자주 사용하세요 (1-3% 권장)`,
    });
  } else if (keywordDensity > 4) {
    score -= 20;
    suggestions.push({
      category: 'seoOptimization',
      severity: 'high',
      message: '키워드 밀도가 너무 높습니다 (키워드 스터핑 위험)',
      recommendation: '키워드 사용을 줄이고 동의어나 관련 표현을 사용하세요',
    });
  }

  // Check meta description
  if (!metaDescription) {
    score -= 10;
    suggestions.push({
      category: 'seoOptimization',
      severity: 'medium',
      message: '메타 설명이 없습니다',
      recommendation: '120-160자의 메타 설명을 추가하세요',
    });
  } else if (metaDescription.length < 100 || metaDescription.length > 170) {
    score -= 5;
    suggestions.push({
      category: 'seoOptimization',
      severity: 'low',
      message: '메타 설명 길이가 최적이 아닙니다',
      recommendation: '120-160자 사이로 조정하세요',
    });
  }

  // Check excerpt
  if (!excerpt || excerpt.length < 50) {
    score -= 5;
    suggestions.push({
      category: 'seoOptimization',
      severity: 'low',
      message: '발췌문이 없거나 너무 짧습니다',
      recommendation: '100-200자의 발췌문을 작성하세요',
    });
  }

  // Check tags
  if (!tags || tags.length < 3) {
    score -= 5;
    suggestions.push({
      category: 'seoOptimization',
      severity: 'low',
      message: '태그가 부족합니다',
      recommendation: '관련 태그를 3-5개 추가하세요',
    });
  }

  return Math.max(0, score);
}

/**
 * Calculate content depth score (0-100)
 * Factors: length, detail level, examples, data
 */
function calculateContentDepthScore(
  input: ContentInput,
  suggestions: QualitySuggestion[]
): number {
  const { content, targetLocale } = input;
  let score = 100;

  const targets = CONTENT_LENGTH_TARGETS[targetLocale] || CONTENT_LENGTH_TARGETS.en;
  const wordCount = content.split(/\s+/).length;

  // Check content length
  if (wordCount < targets.min) {
    score -= 30;
    suggestions.push({
      category: 'contentDepth',
      severity: 'high',
      message: `콘텐츠가 너무 짧습니다 (${wordCount}자)`,
      recommendation: `최소 ${targets.min}자 이상의 콘텐츠를 작성하세요`,
    });
  } else if (wordCount < targets.ideal) {
    score -= 10;
    suggestions.push({
      category: 'contentDepth',
      severity: 'medium',
      message: '콘텐츠 길이가 이상적이지 않습니다',
      recommendation: `${targets.ideal}자 정도의 콘텐츠가 이상적입니다`,
    });
  } else if (wordCount > targets.max) {
    score -= 5;
    suggestions.push({
      category: 'contentDepth',
      severity: 'low',
      message: '콘텐츠가 너무 깁니다',
      recommendation: '핵심 내용만 남기고 간결하게 정리하세요',
    });
  }

  // Check for numbers/statistics (indicates depth)
  const hasNumbers = /\d+%|\d+,\d+|\$\d+|₩\d+/.test(content);
  if (!hasNumbers) {
    score -= 10;
    suggestions.push({
      category: 'contentDepth',
      severity: 'medium',
      message: '구체적인 수치나 통계가 없습니다',
      recommendation: '신뢰성을 높이기 위해 구체적인 데이터를 추가하세요',
    });
  }

  // Check for lists (indicates structured information)
  const hasBulletPoints = /[-•*]\s+.+/m.test(content) || /\d+\.\s+.+/m.test(content);
  if (!hasBulletPoints) {
    score -= 5;
    suggestions.push({
      category: 'contentDepth',
      severity: 'low',
      message: '목록 형식이 없습니다',
      recommendation: '핵심 정보를 목록으로 정리하면 가독성이 높아집니다',
    });
  }

  // Check for questions (indicates engagement with reader)
  const hasQuestions = /\?/.test(content);
  if (!hasQuestions) {
    score -= 5;
  }

  return Math.max(0, score);
}

/**
 * Calculate structure score (0-100)
 * Factors: headings, sections, flow
 */
function calculateStructureScore(
  input: ContentInput,
  suggestions: QualitySuggestion[]
): number {
  const { content } = input;
  let score = 100;

  // Check for headings
  const h2Count = (content.match(/^##\s+.+/gm) || []).length;
  const h3Count = (content.match(/^###\s+.+/gm) || []).length;

  if (h2Count === 0) {
    score -= 20;
    suggestions.push({
      category: 'structure',
      severity: 'high',
      message: 'H2 제목이 없습니다',
      recommendation: '콘텐츠를 섹션으로 나누고 H2 제목을 추가하세요',
    });
  } else if (h2Count < 3) {
    score -= 10;
    suggestions.push({
      category: 'structure',
      severity: 'medium',
      message: '섹션이 부족합니다',
      recommendation: '3-5개의 주요 섹션으로 콘텐츠를 구성하세요',
    });
  }

  // Check heading hierarchy
  if (h3Count > 0 && h2Count === 0) {
    score -= 10;
    suggestions.push({
      category: 'structure',
      severity: 'medium',
      message: '제목 계층 구조가 올바르지 않습니다',
      recommendation: 'H3 전에 H2를 사용하세요',
    });
  }

  // Check paragraph distribution
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 5) {
    score -= 10;
    suggestions.push({
      category: 'structure',
      severity: 'medium',
      message: '단락이 너무 적습니다',
      recommendation: '콘텐츠를 더 많은 단락으로 나누세요',
    });
  }

  // Check for introduction
  const firstParagraph = paragraphs[0] || '';
  if (firstParagraph.length < 100) {
    score -= 5;
    suggestions.push({
      category: 'structure',
      severity: 'low',
      message: '도입부가 너무 짧습니다',
      recommendation: '주제를 소개하는 충분한 도입부를 작성하세요',
    });
  }

  // Check for conclusion (last paragraph should be substantial)
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  if (lastParagraph.length < 50) {
    score -= 5;
    suggestions.push({
      category: 'structure',
      severity: 'low',
      message: '결론이 부족합니다',
      recommendation: '핵심 내용을 요약하는 결론을 추가하세요',
    });
  }

  return Math.max(0, score);
}

/**
 * Calculate engagement score (0-100)
 * Factors: CTA, questions, personal address
 */
function calculateEngagementScore(
  input: ContentInput,
  suggestions: QualitySuggestion[]
): number {
  const { content } = input;
  let score = 100;

  // Check for CTA (Call to Action)
  const ctaPatterns = [
    /상담.*받/,
    /문의.*하세요/,
    /지금.*시작/,
    /더.*알아보/,
    /클릭/,
    /contact/i,
    /learn more/i,
    /get started/i,
    /book.*appointment/i,
  ];

  const hasCTA = ctaPatterns.some(pattern => pattern.test(content));
  if (!hasCTA) {
    score -= 15;
    suggestions.push({
      category: 'engagement',
      severity: 'medium',
      message: 'CTA(행동 유도)가 없습니다',
      recommendation: '독자가 다음 단계를 취하도록 유도하는 문구를 추가하세요',
    });
  }

  // Check for personal address (you, your)
  const personalPatterns = [/당신|여러분|귀하|you|your/i];
  const hasPersonalAddress = personalPatterns.some(pattern => pattern.test(content));
  if (!hasPersonalAddress) {
    score -= 10;
    suggestions.push({
      category: 'engagement',
      severity: 'low',
      message: '독자를 직접 지칭하는 표현이 없습니다',
      recommendation: '"당신", "여러분" 등 직접 호칭을 사용하여 친근감을 높이세요',
    });
  }

  // Check for emotional words
  const emotionalWords = [
    '놀라운', '혁신적인', '최고의', '특별한', '완벽한',
    'amazing', 'revolutionary', 'best', 'special', 'perfect',
    '안전한', '신뢰', '전문', 'safe', 'trust', 'expert',
  ];
  const hasEmotionalWords = emotionalWords.some(word =>
    content.toLowerCase().includes(word.toLowerCase())
  );
  if (!hasEmotionalWords) {
    score -= 5;
  }

  return Math.max(0, score);
}

/**
 * Calculate uniqueness score (0-100)
 * Factors: vocabulary variety, cliche avoidance
 */
function calculateUniquenessScore(
  input: ContentInput,
  suggestions: QualitySuggestion[]
): number {
  const { content } = input;
  let score = 100;

  // Calculate vocabulary variety
  const words = content.toLowerCase().split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  const uniqueWords = new Set(words);
  const vocabularyRatio = uniqueWords.size / words.length;

  if (vocabularyRatio < 0.3) {
    score -= 20;
    suggestions.push({
      category: 'uniqueness',
      severity: 'medium',
      message: '어휘 다양성이 낮습니다',
      recommendation: '동의어를 사용하여 표현을 다양화하세요',
    });
  } else if (vocabularyRatio < 0.5) {
    score -= 10;
    suggestions.push({
      category: 'uniqueness',
      severity: 'low',
      message: '같은 단어가 자주 반복됩니다',
      recommendation: '반복되는 단어를 다른 표현으로 바꿔보세요',
    });
  }

  // Check for common cliches
  const cliches = [
    '말할 필요도 없이',
    '두말할 나위 없이',
    'needless to say',
    'it goes without saying',
    'at the end of the day',
    '결론적으로 말하자면',
  ];

  const hasCliches = cliches.some(cliche =>
    content.toLowerCase().includes(cliche.toLowerCase())
  );
  if (hasCliches) {
    score -= 5;
    suggestions.push({
      category: 'uniqueness',
      severity: 'low',
      message: '상투적인 표현이 있습니다',
      recommendation: '클리셰를 피하고 신선한 표현을 사용하세요',
    });
  }

  return Math.max(0, score);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get a summary of quality issues for quick review
 */
export function getQualitySummary(result: QualityScoreResult): string {
  const { overallScore, grade, breakdown, suggestions } = result;

  const highPriority = suggestions.filter(s => s.severity === 'high');
  const lines: string[] = [
    `Overall Score: ${overallScore}/100 (Grade: ${grade})`,
    '',
    'Breakdown:',
    `  - Readability: ${breakdown.readability}%`,
    `  - SEO: ${breakdown.seoOptimization}%`,
    `  - Depth: ${breakdown.contentDepth}%`,
    `  - Structure: ${breakdown.structure}%`,
    `  - Engagement: ${breakdown.engagement}%`,
    `  - Uniqueness: ${breakdown.uniqueness}%`,
  ];

  if (highPriority.length > 0) {
    lines.push('', 'High Priority Issues:');
    highPriority.forEach(s => {
      lines.push(`  ⚠️ ${s.message}`);
    });
  }

  return lines.join('\n');
}

/**
 * Check if content meets minimum quality threshold
 */
export function meetsQualityThreshold(
  result: QualityScoreResult,
  threshold: number = 70
): boolean {
  return result.overallScore >= threshold;
}
