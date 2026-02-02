/**
 * Author (Interpreter) Assignment System
 *
 * 키워드 등록 시 locale과 category에 맞는 통역사 자동 배분
 * - locale 기반 필터링 (languages JSONB 포함)
 * - category 기반 우선 매칭 (primary_specialty)
 * - 균등 배분 (라운드 로빈) - 동적으로 blog_posts count 계산
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

export interface AuthorPersonaBasic {
  id: string;
  slug: string;
  name: Record<string, string>;
  languages: Array<{ code: string; proficiency: string }>;
  primary_specialty: string | null;
  secondary_specialties: string[] | null;
  post_count: number; // Dynamic count from blog_posts
  is_active: boolean;
}

export interface AssignmentResult {
  authorPersonaId: string | null;
  authorName: string | null;
  reason: string;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * 통역사의 발행된 글 수를 동적으로 가져옴
 */
export async function getAuthorPostCount(authorPersonaId: string): Promise<number> {
  try {
    const supabase = await createAdminClient();

    const { count, error } = await (supabase.from('blog_posts') as any)
      .select('id', { count: 'exact', head: true })
      .eq('author_persona_id', authorPersonaId)
      .eq('status', 'published');

    if (error) {
      console.error('Error getting post count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Get post count error:', error);
    return 0;
  }
}

/**
 * 모든 활성 통역사와 그들의 글 수를 가져옴
 */
export async function getAuthorsWithPostCounts(): Promise<AuthorPersonaBasic[]> {
  try {
    const supabase = await createAdminClient();

    // Use the database function for efficient query
    const { data, error } = await supabase.rpc('get_authors_with_post_counts');

    if (error) {
      console.error('Error fetching authors with post counts:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authors = (data || []) as any[];
    return authors.map((author) => ({
      id: author.id,
      slug: author.slug,
      name: author.name || {},
      languages: author.languages || [],
      primary_specialty: author.primary_specialty,
      secondary_specialties: author.secondary_specialties,
      post_count: author.post_count || 0,
      is_active: author.is_active,
    }));
  } catch (error) {
    console.error('Get authors with post counts error:', error);
    return [];
  }
}

// =====================================================
// MAIN FUNCTIONS
// =====================================================

/**
 * 키워드에 적합한 통역사(Author Persona) 자동 배정
 *
 * @param locale - 타겟 언어 (en, ko, ja, zh-CN, etc.)
 * @param category - 시술 카테고리 (plastic-surgery, dental, etc.)
 * @returns 배정된 Author Persona ID 또는 null
 */
export async function assignAuthorForKeyword(
  locale: Locale | string,
  category?: string
): Promise<AssignmentResult> {
  try {
    // 1. 모든 활성 통역사와 글 수 조회 (동적 count)
    const authors = await getAuthorsWithPostCounts();

    if (!authors || authors.length === 0) {
      console.warn(`No active authors found`);
      return { authorPersonaId: null, authorName: null, reason: 'No active authors' };
    }

    // 2. locale에 해당하는 언어를 구사하는 통역사 필터링
    const localeMatchedAuthors = authors.filter((a) => {
      if (!a.languages || !Array.isArray(a.languages)) return false;
      return a.languages.some((lang) => lang.code === locale);
    });

    if (localeMatchedAuthors.length === 0) {
      console.warn(`No authors found for locale: ${locale}`);
      return { authorPersonaId: null, authorName: null, reason: `No authors for locale ${locale}` };
    }

    // 3. category가 있으면 전문 분야 매칭 시도
    let matchedAuthors = localeMatchedAuthors;

    if (category) {
      // Primary specialty 매칭
      const primaryMatch = matchedAuthors.filter(
        (a) => a.primary_specialty === category
      );

      if (primaryMatch.length > 0) {
        matchedAuthors = primaryMatch;
      } else {
        // Secondary specialties 매칭
        const secondaryMatch = matchedAuthors.filter(
          (a) => a.secondary_specialties?.includes(category)
        );

        if (secondaryMatch.length > 0) {
          matchedAuthors = secondaryMatch;
        }
        // 매칭 안 되면 전체 유지 (locale 매칭된 것들)
      }
    }

    // 4. 균등 배분: post_count가 가장 적은 사람 선택 (라운드 로빈)
    const sortedByPosts = matchedAuthors.sort(
      (a, b) => (a.post_count || 0) - (b.post_count || 0)
    );

    const selectedAuthor = sortedByPosts[0];
    const authorName = selectedAuthor.name?.en || selectedAuthor.name?.ko || selectedAuthor.slug;

    console.log(`Assigned author: ${authorName} (${selectedAuthor.slug}) for locale=${locale}, category=${category || 'any'}, post_count=${selectedAuthor.post_count}`);

    return {
      authorPersonaId: selectedAuthor.id,
      authorName,
      reason: `Matched by ${category ? 'specialty' : 'locale'} with load balancing`,
    };
  } catch (error) {
    console.error('Author assignment error:', error);
    return { authorPersonaId: null, authorName: null, reason: 'Assignment failed' };
  }
}

/**
 * 키워드 등록 시 author_persona_id 자동 설정
 * (API 라우트에서 호출)
 */
export async function autoAssignAuthorToKeyword(
  keywordId: string,
  locale: Locale | string,
  category?: string
): Promise<boolean> {
  try {
    const assignment = await assignAuthorForKeyword(locale, category);

    if (!assignment.authorPersonaId) {
      return false;
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('content_keywords') as any)
      .update({
        author_persona_id: assignment.authorPersonaId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keywordId);

    if (error) {
      console.error('Error updating keyword with author:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Auto-assign author error:', error);
    return false;
  }
}

/**
 * 특정 locale의 모든 통역사 조회 (글 수 포함)
 */
export async function getAuthorsForLocale(
  locale: Locale | string
): Promise<AuthorPersonaBasic[]> {
  try {
    const authors = await getAuthorsWithPostCounts();

    return authors.filter((a) => {
      if (!a.languages || !Array.isArray(a.languages)) return false;
      return a.languages.some((lang) => lang.code === locale);
    });
  } catch (error) {
    console.error('Get authors error:', error);
    return [];
  }
}
