/**
 * Multi-language Content Generation API
 *
 * POST /api/content/generate-multilang
 *
 * Generates content in multiple languages from a source content
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateMultiLanguageContent,
  type Locale,
  type GeneratedContent,
  type TranslationProgress,
} from '@/lib/content/multi-language-generator';

export const maxDuration = 300; // 5 minutes for multiple translations

// =====================================================
// REQUEST TYPES
// =====================================================

interface GenerateMultiLangRequest {
  sourceContent: GeneratedContent;
  sourceLocale: Locale;
  targetLocales: Locale[];
  keyword: string;
  category?: string;
  localize?: boolean;
  maxConcurrency?: number;
}

// =====================================================
// POST HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: GenerateMultiLangRequest = await request.json();

    const {
      sourceContent,
      sourceLocale,
      targetLocales,
      keyword,
      category,
      localize = true,
      maxConcurrency = 3,
    } = body;

    // Validate request
    if (!sourceContent || !sourceLocale || !targetLocales || !keyword) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['sourceContent', 'sourceLocale', 'targetLocales', 'keyword'],
        },
        { status: 400 }
      );
    }

    if (targetLocales.length === 0) {
      return NextResponse.json(
        { error: 'At least one target locale required' },
        { status: 400 }
      );
    }

    console.log(`\n📝 Multi-language content generation request:`);
    console.log(`   Keyword: ${keyword}`);
    console.log(`   Source: ${sourceLocale}`);
    console.log(`   Targets: ${targetLocales.join(', ')}`);
    console.log(`   Localize: ${localize}`);

    // Progress tracking (for future WebSocket implementation)
    const progressCallback = (progress: TranslationProgress) => {
      console.log(
        `   Progress: ${progress.completed}/${progress.total} (${progress.failed} failed, ${progress.inProgress} in progress)`
      );
      if (progress.current) {
        console.log(`   Current: ${progress.current}`);
      }
    };

    // Generate multi-language content
    const result = await generateMultiLanguageContent(
      {
        sourceContent,
        sourceLocale,
        targetLocales,
        keyword,
        category,
        localize,
        maxConcurrency,
      },
      progressCallback
    );

    // Save translations to database
    const savedTranslations = await saveTranslationsToDatabase({
      supabase,
      result,
      keyword,
      category,
      userId: user.id,
    });

    console.log(`\n✅ Multi-language generation complete!`);
    console.log(`   Total cost: $${result.totalCost.toFixed(3)}`);
    console.log(`   Translations saved: ${savedTranslations.length}`);

    return NextResponse.json({
      success: true,
      sourceLocale: result.sourceLocale,
      translations: Array.from(result.translations.entries()).map(([locale, content]) => ({
        locale,
        title: content.title,
        excerpt: content.excerpt,
        contentFormat: content.contentFormat,
      })),
      hreflangTags: result.hreflangTags,
      totalCost: result.totalCost,
      generationTimestamp: result.generationTimestamp,
      savedIds: savedTranslations,
    });
  } catch (error: any) {
    console.error('Multi-language generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate multi-language content',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

async function saveTranslationsToDatabase(options: {
  supabase: any;
  result: any;
  keyword: string;
  category?: string;
  userId: string;
}): Promise<string[]> {
  const { supabase, result, keyword, category, userId } = options;

  const savedIds: string[] = [];

  // Save each translation
  for (const [locale, content] of result.translations.entries()) {
    try {
      const { data, error } = await supabase
        .from('content_drafts')
        .insert({
          keyword_text: keyword,
          locale,
          category: category || 'general',
          title: content.title,
          excerpt: content.excerpt,
          content: content.content,
          content_format: 'html',
          meta_title: content.metaTitle,
          meta_description: content.metaDescription,
          author_name: content.author.name,
          author_name_en: content.author.name_en,
          author_bio: content.author.bio,
          author_years_experience: content.author.years_of_experience,
          tags: content.tags,
          faq_schema: content.faqSchema,
          howto_schema: content.howToSchema,
          images: content.images,
          internal_links: content.internalLinks || [],
          source_locale: result.sourceLocale,
          hreflang_group: `${keyword}-${Date.now()}`,
          status: 'draft',
          created_by: userId,
        })
        .select('id')
        .single();

      if (error) {
        console.error(`Failed to save ${locale} translation:`, error);
      } else if (data) {
        savedIds.push(data.id);
        console.log(`   ✅ Saved ${locale} translation: ${data.id}`);
      }
    } catch (error: any) {
      console.error(`Error saving ${locale} translation:`, error);
    }
  }

  return savedIds;
}

// =====================================================
// GET HANDLER (Status Check)
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const hreflangGroup = searchParams.get('hreflangGroup');

    if (!hreflangGroup) {
      return NextResponse.json(
        { error: 'hreflangGroup parameter required' },
        { status: 400 }
      );
    }

    // Fetch all translations in this hreflang group
    const { data: translations, error } = await supabase
      .from('content_drafts')
      .select(
        'id, locale, title, status, created_at, published_at, source_locale'
      )
      .eq('hreflang_group', hreflangGroup)
      .order('locale', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      hreflangGroup,
      translations: translations || [],
      count: translations?.length || 0,
    });
  } catch (error: any) {
    console.error('Failed to fetch translations:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch translations',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
