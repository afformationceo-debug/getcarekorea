/**
 * Image Generation Pipeline
 *
 * 콘텐츠 생성 완료 후 자동 이미지 생성 파이프라인
 * - 프롬프트 생성 → 이미지 생성 → 저장 → 블로그 포스트 업데이트
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createNanobananaClient, NanobananaClient, GenerationStatus } from './client';
import { generateImagePrompt, generateSimplePrompt, GeneratedPrompt } from './prompt-generator';
import type { Locale } from '@/lib/i18n/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// =====================================================
// TYPES
// =====================================================

export interface ImagePipelineOptions {
  blogPostId: string;
  title: string;
  excerpt: string;
  category: string;
  locale: Locale;
  keyword?: string;
  useSimplePrompt?: boolean;
}

export interface ImagePipelineResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  generationId?: string;
  prompt?: GeneratedPrompt;
  error?: string;
  timeMs?: number;
}

export interface BatchImageResult {
  total: number;
  successful: number;
  failed: number;
  results: {
    blogPostId: string;
    success: boolean;
    imageUrl?: string;
    error?: string;
  }[];
}

// =====================================================
// IMAGE PIPELINE
// =====================================================

/**
 * 단일 블로그 포스트 이미지 생성 파이프라인
 */
export async function runImagePipeline(
  supabase: AnySupabaseClient,
  options: ImagePipelineOptions
): Promise<ImagePipelineResult> {
  const startTime = Date.now();
  const client = createNanobananaClient();

  if (!client) {
    return {
      success: false,
      error: 'Nanobanana client not configured',
      timeMs: Date.now() - startTime,
    };
  }

  try {
    // 1. 프롬프트 생성
    const prompt = options.useSimplePrompt
      ? generateSimplePrompt(options)
      : await generateImagePrompt(options);

    // 2. 이미지 생성 기록 생성
    const { data: generation, error: insertError } = await supabase
      .from('image_generations')
      .insert({
        blog_post_id: options.blogPostId,
        prompt: prompt.prompt,
        negative_prompt: prompt.negativePrompt,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create image generation record:', insertError);
    }

    // 3. 나노바나나 API 호출
    const response = await client.generateImage({
      prompt: prompt.prompt,
      negativePrompt: prompt.negativePrompt,
      style: prompt.style as 'photorealistic' | 'digital-art' | 'cinematic',
      width: 1200,
      height: 630, // OG Image 비율
    });

    // 4. 상태 업데이트 (processing)
    if (generation?.id) {
      await supabase
        .from('image_generations')
        .update({ status: 'generating' })
        .eq('id', generation.id);
    }

    // 5. 완료 대기
    const finalStatus = await client.waitForCompletion(response.id, {
      maxWaitMs: 120000,
      pollIntervalMs: 3000,
      onProgress: (status) => {
        console.log(`Image generation ${response.id}: ${status.status} (${status.progress || 0}%)`);
      },
    });

    if (finalStatus.status === 'failed') {
      // 실패 기록
      if (generation?.id) {
        await supabase
          .from('image_generations')
          .update({
            status: 'failed',
            error_message: finalStatus.error,
          })
          .eq('id', generation.id);
      }

      return {
        success: false,
        generationId: response.id,
        prompt,
        error: finalStatus.error || 'Image generation failed',
        timeMs: Date.now() - startTime,
      };
    }

    // 6. 이미지 URL 획득
    const imageUrl = finalStatus.images?.[0]?.url;
    if (!imageUrl) {
      return {
        success: false,
        generationId: response.id,
        prompt,
        error: 'No image URL returned',
        timeMs: Date.now() - startTime,
      };
    }

    // 7. Supabase Storage에 업로드
    const storedUrl = await uploadToStorage(
      supabase,
      client,
      imageUrl,
      options.blogPostId,
      prompt.suggestedFileName
    );

    // 8. 블로그 포스트 업데이트
    await supabase
      .from('blog_posts')
      .update({
        cover_image_url: storedUrl,
        cover_image_alt: prompt.altText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.blogPostId);

    // 9. 생성 기록 완료
    if (generation?.id) {
      await supabase
        .from('image_generations')
        .update({
          status: 'completed',
          image_url: storedUrl,
          generation_time_ms: Date.now() - startTime,
        })
        .eq('id', generation.id);
    }

    return {
      success: true,
      imageUrl: storedUrl,
      generationId: response.id,
      prompt,
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Image pipeline error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

/**
 * 배치 이미지 생성
 */
export async function runBatchImagePipeline(
  supabase: AnySupabaseClient,
  blogPostIds: string[],
  options: {
    useSimplePrompt?: boolean;
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<BatchImageResult> {
  const { useSimplePrompt = false, concurrency = 2, onProgress } = options;

  const result: BatchImageResult = {
    total: blogPostIds.length,
    successful: 0,
    failed: 0,
    results: [],
  };

  // 블로그 포스트 정보 조회
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, excerpt, category, locale, keyword_id')
    .in('id', blogPostIds);

  if (error || !posts) {
    result.failed = blogPostIds.length;
    result.results = blogPostIds.map(id => ({
      blogPostId: id,
      success: false,
      error: 'Failed to fetch blog posts',
    }));
    return result;
  }

  // 동시 처리 제한을 위한 청크 분할
  for (let i = 0; i < posts.length; i += concurrency) {
    const chunk = posts.slice(i, i + concurrency);

    const chunkResults = await Promise.all(
      chunk.map(async (post) => {
        const pipelineResult = await runImagePipeline(supabase, {
          blogPostId: post.id,
          title: post.title,
          excerpt: post.excerpt || '',
          category: post.category || 'general',
          locale: post.locale,
          useSimplePrompt,
        });

        return {
          blogPostId: post.id,
          success: pipelineResult.success,
          imageUrl: pipelineResult.imageUrl,
          error: pipelineResult.error,
        };
      })
    );

    for (const res of chunkResults) {
      result.results.push(res);
      if (res.success) {
        result.successful++;
      } else {
        result.failed++;
      }
    }

    if (onProgress) {
      onProgress(result.successful + result.failed, result.total);
    }
  }

  return result;
}

// =====================================================
// STORAGE FUNCTIONS
// =====================================================

/**
 * Supabase Storage에 이미지 업로드
 */
async function uploadToStorage(
  supabase: AnySupabaseClient,
  client: NanobananaClient,
  imageUrl: string,
  blogPostId: string,
  fileName: string
): Promise<string> {
  // 이미지 다운로드
  const imageBuffer = await client.downloadImage(imageUrl);

  // 파일 경로 생성
  const timestamp = Date.now();
  const filePath = `blog-images/${blogPostId}/${fileName}-${timestamp}.jpg`;

  // Supabase Storage 업로드
  const { error } = await supabase.storage
    .from('blog-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Storage upload error:', error);
    // 원본 URL 반환 (폴백)
    return imageUrl;
  }

  // Public URL 생성
  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * 기존 이미지 삭제
 */
export async function deleteStoredImage(
  supabase: AnySupabaseClient,
  blogPostId: string
): Promise<boolean> {
  try {
    // 블로그 이미지 폴더 내 파일 목록 조회
    const { data: files } = await supabase.storage
      .from('blog-images')
      .list(`blog-images/${blogPostId}`);

    if (files && files.length > 0) {
      const filePaths = files.map(f => `blog-images/${blogPostId}/${f.name}`);
      await supabase.storage
        .from('blog-images')
        .remove(filePaths);
    }

    return true;
  } catch (error) {
    console.error('Failed to delete stored image:', error);
    return false;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * 이미지 생성이 필요한 포스트 조회
 */
export async function getPostsNeedingImages(
  supabase: AnySupabaseClient,
  options: {
    status?: string;
    limit?: number;
  } = {}
): Promise<{ id: string; title: string }[]> {
  const { status = 'published', limit = 50 } = options;

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title')
    .eq('status', status)
    .is('cover_image_url', null)
    .limit(limit);

  return posts || [];
}

/**
 * 이미지 생성 상태 조회
 */
export async function getImageGenerationStatus(
  supabase: AnySupabaseClient,
  blogPostId: string
): Promise<{
  hasImage: boolean;
  latestGeneration?: {
    status: string;
    imageUrl?: string;
    createdAt: string;
  };
}> {
  // 블로그 포스트 확인
  const { data: post } = await supabase
    .from('blog_posts')
    .select('cover_image_url')
    .eq('id', blogPostId)
    .single();

  // 최근 생성 기록 확인
  const { data: generation } = await supabase
    .from('image_generations')
    .select('status, image_url, created_at')
    .eq('blog_post_id', blogPostId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    hasImage: !!post?.cover_image_url,
    latestGeneration: generation ? {
      status: generation.status,
      imageUrl: generation.image_url,
      createdAt: generation.created_at,
    } : undefined,
  };
}
