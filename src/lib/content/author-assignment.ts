/**
 * Author (Interpreter) Assignment System
 *
 * 키워드 등록 시 locale과 category에 맞는 통역사 자동 배분
 * - locale 기반 필터링 (target_locales 포함)
 * - category 기반 우선 매칭 (primary_specialty)
 * - 균등 배분 (라운드 로빈)
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
  total_posts: number;
  is_active: boolean;
  is_available: boolean;
}

export interface AssignmentResult {
  authorPersonaId: string | null;
  authorName: string | null;
  reason: string;
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
    const supabase = await createAdminClient();

    // 1. 활성 통역사 조회 (languages JSONB 필드 사용)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: authors, error } = await (supabase.from('author_personas') as any)
      .select(`
        id,
        slug,
        name,
        languages,
        primary_specialty,
        secondary_specialties,
        total_posts,
        is_active,
        is_available
      `)
      .eq('is_active', true)
      .eq('is_available', true);

    if (error) {
      console.error('Error fetching authors:', error);
      return { authorPersonaId: null, authorName: null, reason: 'Database error' };
    }

    if (!authors || authors.length === 0) {
      console.warn(`No active authors found`);
      return { authorPersonaId: null, authorName: null, reason: 'No active authors' };
    }

    // 2. locale에 해당하는 언어를 구사하는 통역사 필터링
    const localeMatchedAuthors = authors.filter((a: AuthorPersonaBasic) => {
      if (!a.languages || !Array.isArray(a.languages)) return false;
      return a.languages.some((lang) => lang.code === locale);
    });

    if (localeMatchedAuthors.length === 0) {
      console.warn(`No authors found for locale: ${locale}`);
      return { authorPersonaId: null, authorName: null, reason: `No authors for locale ${locale}` };
    }

    // 3. category가 있으면 전문 분야 매칭 시도
    let matchedAuthors = localeMatchedAuthors as AuthorPersonaBasic[];

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

    // 4. 균등 배분: total_posts가 가장 적은 사람 선택 (라운드 로빈)
    const sortedByPosts = matchedAuthors.sort(
      (a, b) => (a.total_posts || 0) - (b.total_posts || 0)
    );

    const selectedAuthor = sortedByPosts[0];
    const authorName = selectedAuthor.name?.en || selectedAuthor.name?.ko || selectedAuthor.slug;

    console.log(`Assigned author: ${authorName} (${selectedAuthor.slug}) for locale=${locale}, category=${category || 'any'}`);

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
 * 특정 locale의 모든 통역사 조회
 */
export async function getAuthorsForLocale(
  locale: Locale | string
): Promise<AuthorPersonaBasic[]> {
  try {
    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('author_personas') as any)
      .select(`
        id,
        slug,
        name_en,
        name_ko,
        target_locales,
        primary_specialty,
        secondary_specialties,
        total_posts,
        is_active,
        is_available
      `)
      .eq('is_active', true)
      .contains('target_locales', [locale])
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching authors for locale:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get authors error:', error);
    return [];
  }
}

/**
 * 통역사의 할당된 글 수 업데이트
 */
export async function updateAuthorPostCount(authorPersonaId: string): Promise<void> {
  try {
    const supabase = await createAdminClient();

    // 발행된 글 수 계산
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from('blog_posts') as any)
      .select('id', { count: 'exact', head: true })
      .eq('author_persona_id', authorPersonaId)
      .eq('status', 'published');

    // total_posts 업데이트
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('author_personas') as any)
      .update({ total_posts: count || 0 })
      .eq('id', authorPersonaId);
  } catch (error) {
    console.error('Update post count error:', error);
  }
}

/**
 * 모든 통역사의 글 수 일괄 업데이트
 */
export async function syncAllAuthorPostCounts(): Promise<void> {
  try {
    const supabase = await createAdminClient();

    // 모든 활성 통역사 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: authors } = await (supabase.from('author_personas') as any)
      .select('id')
      .eq('is_active', true);

    if (authors) {
      for (const author of authors) {
        await updateAuthorPostCount(author.id);
      }
    }
  } catch (error) {
    console.error('Sync post counts error:', error);
  }
}
