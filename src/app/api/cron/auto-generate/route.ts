/**
 * Auto Content Generation Cron Job
 *
 * GET /api/cron/auto-generate - 대기 중인 키워드로 자동 콘텐츠 생성
 *
 * Vercel Cron: 15분마다 실행 (vercel.json)
 * DB 설정에 따라 실제 실행 여부 결정
 *
 * 동작 방식:
 * 1. system_settings에서 스케줄 설정 조회
 * 2. 현재 시간이 설정된 스케줄에 맞는지 확인
 * 3. 맞으면 content_keywords 테이블에서 status='pending' 인 키워드 조회
 * 4. 각 키워드에 대해 콘텐츠 생성
 * 5. 생성된 콘텐츠를 blog_posts에 저장 (draft 또는 published 상태)
 * 6. 키워드 상태를 'generated'로 업데이트
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

// 기본 배치 크기 (DB 설정으로 오버라이드)
const DEFAULT_BATCH_SIZE = 3;

// 지원 로케일
const VALID_LOCALES: Locale[] = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'];

// =====================================================
// SCHEDULE CHECK HELPERS
// =====================================================

interface CronSettings {
  enabled: boolean;
  batch_size: number;
  schedule: string;
  include_rag: boolean;
  include_images: boolean;
  image_count: number;
  auto_publish: boolean;
  priority_threshold: number;
}

/**
 * Parse cron expression and check if current time matches
 */
function shouldRunNow(cronExpression: string): boolean {
  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentHour = now.getHours();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentDow = now.getDay();

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minutePart, hourPart, dayPart, monthPart, dowPart] = parts;

  // Check minute
  if (!matchesCronField(minutePart, currentMinute, 0, 59)) return false;

  // Check hour
  if (!matchesCronField(hourPart, currentHour, 0, 23)) return false;

  // Check day of month
  if (!matchesCronField(dayPart, currentDay, 1, 31)) return false;

  // Check month
  if (!matchesCronField(monthPart, currentMonth, 1, 12)) return false;

  // Check day of week
  if (!matchesCronField(dowPart, currentDow, 0, 6)) return false;

  return true;
}

/**
 * Check if a value matches a cron field
 */
function matchesCronField(field: string, value: number, min: number, max: number): boolean {
  if (field === '*') return true;

  // Step values: */15, */2, etc.
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2));
    return (value - min) % step === 0;
  }

  // Range: 1-5
  if (field.includes('-') && !field.includes(',')) {
    const [start, end] = field.split('-').map(n => parseInt(n));
    return value >= start && value <= end;
  }

  // List: 1,3,5
  if (field.includes(',')) {
    const values = field.split(',').map(n => parseInt(n.trim()));
    return values.includes(value);
  }

  // Exact value
  return parseInt(field) === value;
}

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

    // 0. 시스템 설정 조회
    const { data: settingsData } = await (supabase.from('system_settings') as any)
      .select('value')
      .eq('key', 'cron_auto_generate')
      .single();

    const settings: CronSettings = settingsData?.value || {
      enabled: true,
      batch_size: DEFAULT_BATCH_SIZE,
      schedule: '0 9 * * *',
      include_rag: true,
      include_images: true,
      image_count: 3,
      auto_publish: false,
      priority_threshold: 0,
    };

    // 0-1. 비활성화 체크
    if (!settings.enabled) {
      console.log('🔕 Auto-generate is disabled');
      return NextResponse.json({
        success: true,
        data: { skipped: true, reason: 'Auto-generate is disabled' },
      });
    }

    // 0-2. 스케줄 체크 (현재 시간이 설정된 스케줄에 맞는지)
    // TODO: 테스트 완료 후 주석 해제
    // if (!shouldRunNow(settings.schedule)) {
    //   console.log(`⏭️ Skipping: Current time does not match schedule (${settings.schedule})`);
    //   return NextResponse.json({
    //     success: true,
    //     data: { skipped: true, reason: 'Not scheduled to run at this time', schedule: settings.schedule },
    //   });
    // }

    console.log(`\n🚀 Auto-generate cron: Schedule matched (${settings.schedule})`);

    // 사용할 배치 크기
    const batchSize = settings.batch_size || DEFAULT_BATCH_SIZE;

    // 1. 대기 중인 키워드 조회 (우선순위: priority DESC, created_at ASC)
    let query = (supabase.from('content_keywords') as any)
      .select(`
        id,
        keyword,
        locale,
        category,
        priority
      `)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(batchSize);

    // priority_threshold 적용
    if (settings.priority_threshold > 0) {
      query = query.gte('priority', settings.priority_threshold);
    }

    const { data: pendingKeywords, error: fetchError } = await query;

    // 1-2. 모든 활성 통역사 조회 (author 매칭용)
    const { data: allPersonas } = await (supabase.from('author_personas') as any)
      .select('id, slug, languages, primary_specialty, total_posts')
      .eq('is_active', true)
      .eq('is_available', true);

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
      authorSlug?: string;
      error?: string;
      cost?: number;
    }[] = [];

    // Round Robin 배치 추적: 이번 배치에서 이미 배정된 통역사 ID
    const assignedInBatch = new Map<string, number>(); // personaId -> 배정 횟수

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
          includeRAG: settings.include_rag,
          includeImages: settings.include_images,
          imageCount: settings.image_count,
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

        // 2-4. Author 자동 매칭 (locale + specialty 기반 + Round Robin)
        let authorPersonaId: string | null = null;
        let selectedPersonaSlug: string | null = null;

        if (allPersonas && allPersonas.length > 0) {
          // Filter personas who speak this locale's language
          const matchingPersonas = allPersonas.filter((p: { languages: Array<{ code: string }> }) => {
            if (!p.languages || !Array.isArray(p.languages)) return false;
            return p.languages.some((lang: { code: string }) => lang.code === kw.locale);
          });

          if (matchingPersonas.length > 0) {
            // Round Robin: total_posts + 이번 배치에서 배정된 횟수를 합산하여 정렬
            const personasWithBatchCount = matchingPersonas.map((p: { id: string; total_posts: number; primary_specialty: string; slug: string }) => ({
              ...p,
              effectivePosts: (p.total_posts || 0) + (assignedInBatch.get(p.id) || 0),
            }));

            // 1순위: specialty 매칭 + 가장 적은 posts
            const specialtyMatched = personasWithBatchCount.filter(
              (p: { primary_specialty: string }) => p.primary_specialty === (kw.category || 'general')
            );

            let candidates = specialtyMatched.length > 0 ? specialtyMatched : personasWithBatchCount;

            // effectivePosts 기준 정렬 (Round Robin)
            candidates.sort((a: { effectivePosts: number }, b: { effectivePosts: number }) =>
              a.effectivePosts - b.effectivePosts
            );

            const selectedPersona = candidates[0];
            authorPersonaId = selectedPersona.id;
            selectedPersonaSlug = selectedPersona.slug;

            // 배치 카운터 업데이트
            assignedInBatch.set(selectedPersona.id, (assignedInBatch.get(selectedPersona.id) || 0) + 1);

            console.log(`   👤 Author: ${selectedPersona.slug} (posts: ${selectedPersona.total_posts}, batch: ${assignedInBatch.get(selectedPersona.id)})`);
          }
        }

        // 2-5. DB에 저장
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
          author_persona_id: authorPersonaId,
          status: settings.auto_publish ? 'published' : 'draft',
          published_at: settings.auto_publish ? new Date().toISOString() : null,
          generation_metadata: {
            keyword: kw.keyword,
            locale: kw.locale,
            estimatedCost: generatedContent.estimatedCost + totalImageCost,
            generationTimestamp: generatedContent.generationTimestamp,
            includeRAG: settings.include_rag,
            includeImages: settings.include_images,
            author: generatedContent.author,
            faqSchema: generatedContent.faqSchema,
            howToSchema: generatedContent.howToSchema,
            images: generatedContent.images,
            internalLinks: generatedContent.internalLinks || [],
            cronGenerated: true,
          },
        };

        // 예약 발행일이 있으면 scheduled 상태로 (target_publish_date 컬럼 추가 시 활성화)
        // if (kw.target_publish_date) {
        //   blogPostData.status = 'scheduled';
        //   blogPostData.scheduled_at = kw.target_publish_date;
        // }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: savedPost, error: saveError } = await (supabase.from('blog_posts') as any)
          .insert(blogPostData)
          .select('id')
          .single();

        if (saveError) {
          throw new Error(`DB save failed: ${saveError.message}`);
        }

        // 2-6. 키워드 상태 업데이트
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

        // 2-7. Author의 total_posts 업데이트 (직접 증가)
        if (authorPersonaId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: currentPersona } = await (supabase.from('author_personas') as any)
            .select('total_posts')
            .eq('id', authorPersonaId)
            .single();
          if (currentPersona) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('author_personas') as any)
              .update({ total_posts: (currentPersona.total_posts || 0) + 1 })
              .eq('id', authorPersonaId);
          }
        }

        results.push({
          keywordId: kw.id,
          keyword: kw.keyword,
          locale: kw.locale,
          success: true,
          blogPostId: savedPost.id,
          authorSlug: selectedPersonaSlug || undefined,
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
    console.error('Error type:', typeof error);
    console.error('Error JSON:', JSON.stringify(error, null, 2));

    const errorMessage = error instanceof Error
      ? error.message
      : (typeof error === 'object' && error !== null)
        ? JSON.stringify(error)
        : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // 에러 로그 기록
    try {
      const supabase = await createAdminClient();
      await logCronExecution(supabase, 'auto-generate', 'error', {
        error: errorMessage,
      }, Date.now() - startTime);
    } catch {
      // 로그 기록 실패 무시
    }

    return NextResponse.json(
      { error: 'Failed to process auto-generation', details: errorMessage, stack: errorStack },
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
