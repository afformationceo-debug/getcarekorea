/**
 * Test Content Generation API
 *
 * GET /api/cron/test-generate?keywordId=xxx
 *
 * 특정 키워드 ID로 콘텐츠 생성 테스트
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateSingleLanguageContent } from '@/lib/content/single-content-generator';
import { generateImages, injectImagesIntoHTML } from '@/lib/content/image-helper';
import type { ImageMetadata } from '@/lib/content/image-helper';
import type { Locale } from '@/lib/content/multi-language-generator';

export const runtime = 'nodejs';
export const maxDuration = 300;

const VALID_LOCALES: Locale[] = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'];

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keywordId');

    if (!keywordId) {
      return NextResponse.json({ error: 'keywordId is required' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    console.log(`\n🧪 Test Generate: Starting for keyword ${keywordId}`);

    // 1. 키워드 조회
    const { data: kw, error: kwError } = await (supabase.from('content_keywords') as any)
      .select('id, keyword, locale, category, priority, status')
      .eq('id', keywordId)
      .single();

    if (kwError || !kw) {
      return NextResponse.json({
        error: 'Keyword not found',
        details: kwError?.message
      }, { status: 404 });
    }

    console.log(`   📝 Keyword: "${kw.keyword}" (${kw.locale}), status: ${kw.status}`);

    // 2. 로케일 검증
    if (!VALID_LOCALES.includes(kw.locale as Locale)) {
      return NextResponse.json({ error: `Invalid locale: ${kw.locale}` }, { status: 400 });
    }

    // 3. 키워드 상태를 'generating'으로 변경
    await (supabase.from('content_keywords') as any)
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', kw.id);

    // 4. 콘텐츠 생성 (이미지 포함)
    console.log(`   🤖 Generating content with images...`);
    const generatedContent = await generateSingleLanguageContent({
      keyword: kw.keyword,
      locale: kw.locale as Locale,
      category: kw.category || 'general',
      includeRAG: true,
      includeImages: true,
      imageCount: 3,
    });

    console.log(`   ✅ Content generated: "${generatedContent.title}"`);
    console.log(`   🖼️ Images to generate: ${generatedContent.images?.length || 0}`);

    // 4-1. 이미지 생성 및 삽입
    let finalContent = generatedContent.content;
    let totalImageCost = 0;
    let generatedImageCount = 0;

    if (generatedContent.images && generatedContent.images.length > 0) {
      try {
        console.log(`   🎨 Generating images...`);
        const imageMetadata: ImageMetadata[] = generatedContent.images.map(img => ({
          position: img.position,
          placeholder: img.placeholder,
          prompt: img.prompt,
          alt: img.alt,
          caption: img.caption,
          contextBefore: img.contextBefore,
          contextAfter: img.contextAfter,
        }));

        const imageResult = await generateImages({
          images: imageMetadata,
          keyword: kw.keyword,
          locale: kw.locale,
          size: '1024x1024',
          quality: 'hd',
          style: 'natural',
        });

        if (imageResult.images.length > 0) {
          finalContent = injectImagesIntoHTML(generatedContent.content, imageResult.images);
          totalImageCost = imageResult.total_cost;
          generatedImageCount = imageResult.images.length;
          console.log(`   ✅ ${imageResult.images.length} images generated ($${totalImageCost.toFixed(4)})`);
        }
      } catch (imageError: unknown) {
        console.warn(`   ⚠️ Image generation failed:`, imageError instanceof Error ? imageError.message : 'Unknown error');
      }
    }

    // 5. Author 매칭 (optional)
    const { data: allPersonas } = await (supabase.from('author_personas') as any)
      .select('id, slug, languages, primary_specialty, total_posts')
      .eq('is_active', true)
      .eq('is_available', true);

    let authorPersonaId: string | null = null;
    let selectedPersonaSlug: string | null = null;

    if (allPersonas && allPersonas.length > 0) {
      const matchingPersonas = allPersonas.filter((p: any) => {
        if (!p.languages || !Array.isArray(p.languages)) return false;
        return p.languages.some((lang: any) => lang.code === kw.locale);
      });

      if (matchingPersonas.length > 0) {
        matchingPersonas.sort((a: any, b: any) => (a.total_posts || 0) - (b.total_posts || 0));
        const selectedPersona = matchingPersonas[0];
        authorPersonaId = selectedPersona.id;
        selectedPersonaSlug = selectedPersona.slug;
        console.log(`   👤 Author: ${selectedPersonaSlug}`);
      }
    }

    // 6. DB에 저장
    const slug = `${kw.keyword.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-${Date.now()}`;
    const normalizedLocale = kw.locale.toLowerCase().replace(/-/g, '_');
    const localeField = (base: string) => `${base}_${normalizedLocale}`;

    const blogPostData: Record<string, unknown> = {
      slug,
      [localeField('title')]: generatedContent.title,
      [localeField('excerpt')]: generatedContent.excerpt,
      [localeField('content')]: finalContent,  // 이미지 삽입된 콘텐츠
      [localeField('meta_title')]: generatedContent.metaTitle,
      [localeField('meta_description')]: generatedContent.metaDescription,
      title_en: normalizedLocale === 'en' ? generatedContent.title : generatedContent.title,
      category: kw.category || 'general',
      tags: generatedContent.tags,
      author_persona_id: authorPersonaId,
      status: 'draft',
      generation_metadata: {
        keyword: kw.keyword,
        locale: kw.locale,
        estimatedCost: generatedContent.estimatedCost + totalImageCost,
        imageCost: totalImageCost,
        imageCount: generatedImageCount,
        generationTimestamp: generatedContent.generationTimestamp,
        testGenerated: true,
      },
    };

    const { data: savedPost, error: saveError } = await (supabase.from('blog_posts') as any)
      .insert(blogPostData)
      .select('id, slug')
      .single();

    if (saveError) {
      // 키워드 상태를 error로 변경
      await (supabase.from('content_keywords') as any)
        .update({ status: 'error', error_message: saveError.message })
        .eq('id', kw.id);

      return NextResponse.json({
        error: 'Failed to save blog post',
        details: saveError.message
      }, { status: 500 });
    }

    // 7. 키워드 상태 업데이트
    await (supabase.from('content_keywords') as any)
      .update({
        status: 'generated',
        blog_post_id: savedPost.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kw.id);

    // 8. Author total_posts 업데이트
    if (authorPersonaId) {
      const { data: currentPersona } = await (supabase.from('author_personas') as any)
        .select('total_posts')
        .eq('id', authorPersonaId)
        .single();
      if (currentPersona) {
        await (supabase.from('author_personas') as any)
          .update({ total_posts: (currentPersona.total_posts || 0) + 1 })
          .eq('id', authorPersonaId);
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Test generate completed in ${totalTime}s`);

    return NextResponse.json({
      success: true,
      data: {
        keyword: kw.keyword,
        locale: kw.locale,
        blogPostId: savedPost.id,
        blogPostSlug: savedPost.slug,
        authorSlug: selectedPersonaSlug,
        authorPersonaId: authorPersonaId,
        title: generatedContent.title,
        imageCount: generatedImageCount,
        estimatedCost: generatedContent.estimatedCost + totalImageCost,
        imageCost: totalImageCost,
        executionTime: `${totalTime}s`,
      },
    });

  } catch (error: unknown) {
    console.error('Test generate error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json({
      error: 'Failed to generate content',
      details: errorMessage,
    }, { status: 500 });
  }
}
