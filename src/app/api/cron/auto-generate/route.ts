/**
 * Auto Content Generation Cron Job
 *
 * GET /api/cron/auto-generate - 대기 중인 키워드로 자동 콘텐츠 생성
 *
 * Vercel Cron 설정 (vercel.json):
 * "crons": [{ "path": "/api/cron/auto-generate", "schedule": "0 9 * * *" }]
 * (매일 오전 9시 실행)
 *
 * 동작 방식:
 * 1. content_keywords 테이블에서 status='pending' 인 키워드 조회
 * 2. 각 키워드에 대해 콘텐츠 생성
 * 3. 생성된 콘텐츠를 blog_posts에 저장 (draft 상태)
 * 4. 키워드 상태를 'generated'로 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateSingleLanguageContent } from '@/lib/content/single-content-generator';
import { generateImages, injectImagesIntoHTML } from '@/lib/content/image-helper';
import type { ImageMetadata } from '@/lib/content/image-helper';
import type { Locale } from '@/lib/content/multi-language-generator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5분 타임아웃

// Cron 인증 키
const CRON_SECRET = process.env.CRON_SECRET;

// 일일 생성 제한
const DAILY_GENERATION_LIMIT = 5;

// 지원 로케일
const VALID_LOCALES: Locale[] = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'];

/**
 * GET /api/cron/auto-generate
 * 대기 중인 키워드 자동 콘텐츠 생성
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Cron 인증 확인
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // 1. 대기 중인 키워드 조회 (우선순위: priority DESC, created_at ASC)
     
    const { data: pendingKeywords, error: fetchError } = await (supabase
      .from('content_keywords') as any)
      .select(`
        id,
        keyword,
        locale,
        category,
        priority,
        target_publish_date,
        author_persona_id
      `)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(DAILY_GENERATION_LIMIT);

    if (fetchError) {
      console.error('Failed to fetch pending keywords:', fetchError);
      throw fetchError;
    }

    if (!pendingKeywords || pendingKeywords.length === 0) {
      // 로그 기록
      await logCronExecution(supabase, 'auto-generate', 'success', {
        message: 'No pending keywords to process',
        processedCount: 0,
      }, Date.now() - startTime);

      return NextResponse.json({
        success: true,
        data: {
          generated: 0,
          message: 'No pending keywords to process',
        },
      });
    }

    console.log(`\n🚀 Auto-generate cron: Processing ${pendingKeywords.length} keywords`);

    // 2. 각 키워드에 대해 콘텐츠 생성
    const results: {
      keywordId: string;
      keyword: string;
      locale: string;
      success: boolean;
      blogPostId?: string;
      error?: string;
      cost?: number;
    }[] = [];

    for (const kw of pendingKeywords) {
      const kwStartTime = Date.now();
      console.log(`\n📝 Processing: ${kw.keyword} (${kw.locale})`);

      try {
        // 로케일 검증
        if (!VALID_LOCALES.includes(kw.locale as Locale)) {
          throw new Error(`Invalid locale: ${kw.locale}`);
        }

        // 2-1. 키워드 상태를 'generating'으로 업데이트
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('content_keywords') as any)
          .update({ status: 'generating', updated_at: new Date().toISOString() })
          .eq('id', kw.id);

        // 2-2. 콘텐츠 생성
        const generatedContent = await generateSingleLanguageContent({
          keyword: kw.keyword,
          locale: kw.locale as Locale,
          category: kw.category || 'general',
          includeRAG: true,
          includeImages: true,
          imageCount: 3,
        });

        // 2-3. 이미지 생성 (선택적)
        let finalContent = generatedContent.content;
        let totalImageCost = 0;

        if (generatedContent.images && generatedContent.images.length > 0) {
          try {
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
              console.log(`   ✅ ${imageResult.images.length} images generated`);
            }
          } catch (imageError: unknown) {
            console.warn(`   ⚠️  Image generation failed:`, imageError instanceof Error ? imageError.message : 'Unknown error');
          }
        }

        // 2-4. DB에 저장
        const slug = `${kw.keyword.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-${Date.now()}`;
        const normalizedLocale = kw.locale.toLowerCase().replace(/-/g, '_');
        const localeField = (base: string) => `${base}_${normalizedLocale}`;

        const blogPostData: Record<string, unknown> = {
          slug,
          [localeField('title')]: generatedContent.title,
          [localeField('excerpt')]: generatedContent.excerpt,
          [localeField('content')]: finalContent,
          [localeField('meta_title')]: generatedContent.metaTitle,
          [localeField('meta_description')]: generatedContent.metaDescription,
          title_en: normalizedLocale === 'en' ? generatedContent.title : generatedContent.title,
          category: kw.category || 'general',
          tags: generatedContent.tags,
          author_persona_id: kw.author_persona_id || null, // Will be auto-assigned if null
          status: 'draft',
          generation_metadata: {
            keyword: kw.keyword,
            locale: kw.locale,
            estimatedCost: generatedContent.estimatedCost + totalImageCost,
            generationTimestamp: generatedContent.generationTimestamp,
            includeRAG: true,
            includeImages: true,
            author: generatedContent.author,
            faqSchema: generatedContent.faqSchema,
            howToSchema: generatedContent.howToSchema,
            images: generatedContent.images,
            internalLinks: generatedContent.internalLinks || [],
            cronGenerated: true,
          },
        };

        // 예약 발행일이 있으면 scheduled 상태로
        if (kw.target_publish_date) {
          blogPostData.status = 'scheduled';
          blogPostData.scheduled_at = kw.target_publish_date;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: savedPost, error: saveError } = await (supabase.from('blog_posts') as any)
          .insert(blogPostData)
          .select('id')
          .single();

        if (saveError) {
          throw new Error(`DB save failed: ${saveError.message}`);
        }

        // 2-5. 키워드 상태 업데이트
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('content_keywords') as any)
          .update({
            status: 'generated',
            blog_post_id: savedPost.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', kw.id);

        const kwDuration = ((Date.now() - kwStartTime) / 1000).toFixed(1);
        console.log(`   ✅ Generated in ${kwDuration}s, saved as ${savedPost.id}`);

        results.push({
          keywordId: kw.id,
          keyword: kw.keyword,
          locale: kw.locale,
          success: true,
          blogPostId: savedPost.id,
          cost: generatedContent.estimatedCost + totalImageCost,
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`   ❌ Failed: ${errorMessage}`);

        // 키워드 상태를 'error'로 업데이트
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('content_keywords') as any)
          .update({
            status: 'error',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', kw.id);

        results.push({
          keywordId: kw.id,
          keyword: kw.keyword,
          locale: kw.locale,
          success: false,
          error: errorMessage,
        });
      }
    }

    // 3. 결과 요약
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalTime = Date.now() - startTime;

    // 로그 기록
    await logCronExecution(supabase, 'auto-generate', failedCount === 0 ? 'success' : 'partial', {
      total: pendingKeywords.length,
      generated: successCount,
      failed: failedCount,
      totalCost,
      results,
    }, totalTime);

    console.log(`\n✅ Auto-generate completed: ${successCount}/${pendingKeywords.length} successful`);
    console.log(`   Total cost: $${totalCost.toFixed(4)}`);
    console.log(`   Total time: ${(totalTime / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      data: {
        total: pendingKeywords.length,
        generated: successCount,
        failed: failedCount,
        totalCost,
        results,
      },
      message: `Generated ${successCount}/${pendingKeywords.length} content items`,
    });

  } catch (error: unknown) {
    console.error('Auto-generate cron error:', error);

    // 에러 로그 기록
    try {
      const supabase = await createAdminClient();
      await logCronExecution(supabase, 'auto-generate', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      }, Date.now() - startTime);
    } catch {
      // 로그 기록 실패 무시
    }

    return NextResponse.json(
      { error: 'Failed to process auto-generation' },
      { status: 500 }
    );
  }
}

/**
 * Cron 실행 로그 기록
 */
async function logCronExecution(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  jobName: string,
  status: 'success' | 'partial' | 'error',
  details: Record<string, unknown>,
  executionTimeMs: number
) {
  try {
    await supabase.from('cron_logs').insert({
      job_name: jobName,
      status,
      records_processed: (details.generated as number) || 0,
      execution_time_ms: executionTimeMs,
      details,
      created_at: new Date().toISOString(),
    });
  } catch {
    // cron_logs 테이블이 없어도 무시
  }
}
