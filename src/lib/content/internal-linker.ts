/**
 * Internal Link Insertion System
 *
 * Automatically inserts relevant internal links into content
 * to improve SEO and user navigation.
 */

import { createAdminClient } from '@/lib/supabase/server';

// =====================================================
// TYPES
// =====================================================

export interface LinkCandidate {
  id: string;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  locale: string;
  relevanceScore: number;
  anchorText: string;
}

export interface LinkInsertionResult {
  modifiedContent: string;
  insertedLinks: InsertedLink[];
  totalLinksAdded: number;
}

export interface InsertedLink {
  targetSlug: string;
  anchorText: string;
  position: number;
  context: string;
}

export interface InternalLinkConfig {
  maxLinksPerPost: number;
  minContentLength: number;
  minAnchorLength: number;
  maxAnchorLength: number;
  avoidLinkingInFirstParagraph: boolean;
  avoidLinkingInHeadings: boolean;
  preferSameCategory: boolean;
  samePageLinkAllowed: boolean;
}

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_CONFIG: InternalLinkConfig = {
  maxLinksPerPost: 5,
  minContentLength: 500,
  minAnchorLength: 2,
  maxAnchorLength: 50,
  avoidLinkingInFirstParagraph: true,
  avoidLinkingInHeadings: true,
  preferSameCategory: true,
  samePageLinkAllowed: false,
};

// Keywords/phrases that should not be linked
const EXCLUDED_PHRASES = new Set([
  '한국',
  'korea',
  'korean',
  'the',
  'and',
  'or',
  'but',
  '그러나',
  '하지만',
  '그리고',
]);

// Category-related keywords for matching
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'plastic-surgery': [
    '성형', '쌍꺼풀', '코성형', '안면윤곽', '지방흡입',
    'plastic surgery', 'rhinoplasty', 'double eyelid', 'liposuction',
    'facelift', 'breast augmentation', 'jaw surgery',
  ],
  'dermatology': [
    '피부', '레이저', '보톡스', '필러', '여드름', '기미',
    'skin', 'laser', 'botox', 'filler', 'acne', 'pigmentation',
    'dermatology', 'skincare', 'anti-aging',
  ],
  'dental': [
    '치과', '임플란트', '교정', '치아', '미백', '라미네이트',
    'dental', 'implant', 'orthodontic', 'teeth', 'whitening', 'veneer',
  ],
  'health-checkup': [
    '건강검진', '종합검진', '암검진', 'MRI', 'CT', '내시경',
    'health checkup', 'screening', 'cancer screening', 'medical checkup',
  ],
  'medical-tourism': [
    '의료관광', '통역', '병원', '진료', '상담', '비용',
    'medical tourism', 'interpreter', 'hospital', 'treatment', 'cost',
  ],
};

// =====================================================
// MAIN FUNCTIONS
// =====================================================

/**
 * Insert internal links into content
 */
export async function insertInternalLinks(
  content: string,
  currentPostSlug: string,
  locale: string,
  category: string | null,
  config: Partial<InternalLinkConfig> = {}
): Promise<LinkInsertionResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check minimum content length
  if (content.length < finalConfig.minContentLength) {
    return {
      modifiedContent: content,
      insertedLinks: [],
      totalLinksAdded: 0,
    };
  }

  // Get link candidates
  const candidates = await findLinkCandidates(
    content,
    currentPostSlug,
    locale,
    category,
    finalConfig
  );

  if (candidates.length === 0) {
    return {
      modifiedContent: content,
      insertedLinks: [],
      totalLinksAdded: 0,
    };
  }

  // Sort by relevance score
  candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Select top candidates
  const selectedCandidates = candidates.slice(0, finalConfig.maxLinksPerPost);

  // Insert links
  const { modifiedContent, insertedLinks } = insertLinksIntoContent(
    content,
    selectedCandidates,
    locale,
    finalConfig
  );

  return {
    modifiedContent,
    insertedLinks,
    totalLinksAdded: insertedLinks.length,
  };
}

/**
 * Find related posts that could be linked
 */
export async function findRelatedPosts(
  currentPostSlug: string,
  locale: string,
  category: string | null,
  limit: number = 10
): Promise<LinkCandidate[]> {
  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('blog_posts') as any)
    .select('id, slug, title_en, title_ko, category, tags')
    .eq('status', 'published')
    .neq('slug', currentPostSlug);

  // Prefer same category
  if (category) {
    query = query.eq('category', category);
  }

  const { data: posts } = await query.limit(limit);

  if (!posts || posts.length === 0) {
    return [];
  }

  return posts.map((post: {
    id: string;
    slug: string;
    title_en: string | null;
    title_ko: string | null;
    category: string | null;
    tags: string[];
  }) => ({
    id: post.id,
    slug: post.slug,
    title: locale === 'ko' ? (post.title_ko || post.title_en || '') : (post.title_en || ''),
    category: post.category || 'uncategorized',
    tags: post.tags || [],
    locale,
    relevanceScore: 0,
    anchorText: locale === 'ko' ? (post.title_ko || post.title_en || '') : (post.title_en || ''),
  }));
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Find link candidates based on content analysis
 */
async function findLinkCandidates(
  content: string,
  currentPostSlug: string,
  locale: string,
  category: string | null,
  config: InternalLinkConfig
): Promise<LinkCandidate[]> {
  const supabase = await createAdminClient();
  const contentLower = content.toLowerCase();

  // Get all published posts except current
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: posts } = await (supabase.from('blog_posts') as any)
    .select('id, slug, title_en, title_ko, title_ja, title_zh_cn, category, tags')
    .eq('status', 'published')
    .neq('slug', currentPostSlug);

  if (!posts || posts.length === 0) {
    return [];
  }

  const candidates: LinkCandidate[] = [];

  for (const post of posts) {
    // Get title in appropriate locale
    const titleKey = `title_${locale.replace('-', '_').toLowerCase()}`;
    const title = (post as Record<string, unknown>)[titleKey] as string || post.title_en || '';

    if (!title) continue;

    // Calculate relevance score
    let relevanceScore = 0;
    let bestAnchorText = title;

    // Check if title appears in content
    if (contentLower.includes(title.toLowerCase())) {
      relevanceScore += 50;
      bestAnchorText = title;
    }

    // Check if any tags appear in content
    const tags = post.tags || [];
    for (const tag of tags) {
      if (contentLower.includes(tag.toLowerCase())) {
        relevanceScore += 20;
        if (tag.length > bestAnchorText.length / 2) {
          bestAnchorText = tag;
        }
      }
    }

    // Check category keywords
    const categoryKeywords = CATEGORY_KEYWORDS[post.category || ''] || [];
    for (const keyword of categoryKeywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        relevanceScore += 10;
      }
    }

    // Boost same category
    if (config.preferSameCategory && post.category === category) {
      relevanceScore *= 1.5;
    }

    // Skip if no relevance
    if (relevanceScore === 0) continue;

    // Find best anchor text from content
    const foundAnchor = findBestAnchorText(content, title, tags, config);
    if (foundAnchor) {
      bestAnchorText = foundAnchor;
      relevanceScore += 30;
    }

    candidates.push({
      id: post.id,
      slug: post.slug,
      title,
      category: post.category || 'uncategorized',
      tags,
      locale,
      relevanceScore,
      anchorText: bestAnchorText,
    });
  }

  return candidates;
}

/**
 * Find the best anchor text for a link
 */
function findBestAnchorText(
  content: string,
  title: string,
  tags: string[],
  config: InternalLinkConfig
): string | null {
  const contentLower = content.toLowerCase();

  // Try full title first
  if (contentLower.includes(title.toLowerCase())) {
    return title;
  }

  // Try title words (2+ word combinations)
  const titleWords = title.split(/\s+/).filter(w => w.length > 2);
  for (let len = titleWords.length; len >= 2; len--) {
    for (let i = 0; i <= titleWords.length - len; i++) {
      const phrase = titleWords.slice(i, i + len).join(' ');
      if (phrase.length >= config.minAnchorLength && contentLower.includes(phrase.toLowerCase())) {
        return phrase;
      }
    }
  }

  // Try tags
  for (const tag of tags) {
    if (tag.length >= config.minAnchorLength && contentLower.includes(tag.toLowerCase())) {
      return tag;
    }
  }

  return null;
}

/**
 * Insert links into content at appropriate positions
 */
function insertLinksIntoContent(
  content: string,
  candidates: LinkCandidate[],
  locale: string,
  config: InternalLinkConfig
): { modifiedContent: string; insertedLinks: InsertedLink[] } {
  let modifiedContent = content;
  const insertedLinks: InsertedLink[] = [];
  const linkedPhrases = new Set<string>();

  // Split content into sections
  const paragraphs = content.split(/\n\n+/);
  const currentPosition = 0;

  for (const candidate of candidates) {
    const { slug, anchorText } = candidate;

    // Skip if already linked this phrase
    if (linkedPhrases.has(anchorText.toLowerCase())) continue;

    // Find anchor text in content
    const anchorLower = anchorText.toLowerCase();
    const contentLower = modifiedContent.toLowerCase();
    let position = contentLower.indexOf(anchorLower);

    // Skip if not found
    if (position === -1) continue;

    // Check position constraints
    if (config.avoidLinkingInFirstParagraph) {
      const firstParagraphEnd = modifiedContent.indexOf('\n\n');
      if (firstParagraphEnd === -1 || position < firstParagraphEnd) {
        // Try to find another occurrence
        position = contentLower.indexOf(anchorLower, firstParagraphEnd);
        if (position === -1) continue;
      }
    }

    // Check if in heading
    if (config.avoidLinkingInHeadings) {
      const lineStart = modifiedContent.lastIndexOf('\n', position) + 1;
      const lineContent = modifiedContent.slice(lineStart, position);
      if (lineContent.match(/^#+\s/)) {
        // In a heading, skip
        continue;
      }
    }

    // Check if already inside a link
    const beforePosition = modifiedContent.slice(Math.max(0, position - 100), position);
    const afterPosition = modifiedContent.slice(position, position + anchorText.length + 50);
    if (beforePosition.includes('[') && !beforePosition.includes(']')) continue;
    if (afterPosition.includes('](') && afterPosition.indexOf('](') < anchorText.length) continue;

    // Get exact text from content (preserve case)
    const exactText = modifiedContent.slice(position, position + anchorText.length);

    // Create markdown link
    const linkUrl = `/${locale}/blog/${slug}`;
    const markdownLink = `[${exactText}](${linkUrl})`;

    // Insert link
    modifiedContent =
      modifiedContent.slice(0, position) +
      markdownLink +
      modifiedContent.slice(position + anchorText.length);

    // Track inserted link
    insertedLinks.push({
      targetSlug: slug,
      anchorText: exactText,
      position,
      context: modifiedContent.slice(Math.max(0, position - 30), position + markdownLink.length + 30),
    });

    linkedPhrases.add(anchorLower);

    // Stop if we've reached the max
    if (insertedLinks.length >= config.maxLinksPerPost) break;
  }

  return { modifiedContent, insertedLinks };
}

/**
 * Remove all internal links from content
 */
export function removeInternalLinks(content: string): string {
  // Match markdown links and replace with just the text
  return content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

/**
 * Count internal links in content
 */
export function countInternalLinks(content: string, baseUrl?: string): number {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let count = 0;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const url = match[2];
    // Count only internal links (relative URLs or same domain)
    if (url.startsWith('/') || (baseUrl && url.includes(baseUrl))) {
      count++;
    }
  }

  return count;
}

/**
 * Get all internal links from content
 */
export function extractInternalLinks(content: string): Array<{ text: string; url: string }> {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: Array<{ text: string; url: string }> = [];
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const url = match[2];
    if (url.startsWith('/')) {
      links.push({
        text: match[1],
        url: match[2],
      });
    }
  }

  return links;
}

/**
 * Validate internal links (check if target pages exist)
 */
export async function validateInternalLinks(
  content: string
): Promise<Array<{ url: string; valid: boolean; error?: string }>> {
  const links = extractInternalLinks(content);
  const supabase = await createAdminClient();
  const results: Array<{ url: string; valid: boolean; error?: string }> = [];

  for (const link of links) {
    // Extract slug from URL
    const slugMatch = link.url.match(/\/blog\/([^/]+)$/);
    if (!slugMatch) {
      results.push({ url: link.url, valid: false, error: 'Invalid URL format' });
      continue;
    }

    const slug = slugMatch[1];

    // Check if post exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post } = await (supabase.from('blog_posts') as any)
      .select('id, status')
      .eq('slug', slug)
      .single();

    if (!post) {
      results.push({ url: link.url, valid: false, error: 'Post not found' });
    } else if (post.status !== 'published') {
      results.push({ url: link.url, valid: false, error: `Post is ${post.status}` });
    } else {
      results.push({ url: link.url, valid: true });
    }
  }

  return results;
}
