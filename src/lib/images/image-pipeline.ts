/**
 * Image Generation Pipeline (DALL-E 3)
 *
 * ⚠️ DEPRECATED: DO NOT USE THIS FILE
 * =====================================
 * This file uses DALL-E 3 which is NO LONGER the approved model.
 *
 * ✅ USE INSTEAD: @/lib/images/imagen4-pipeline.ts
 *
 * GetCareKorea uses Google Imagen 4 for ALL image generation.
 * Model: google/imagen-4 (via Replicate API)
 *
 * @deprecated Use imagen4-pipeline.ts instead
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createDalleClient, DalleClient, optimizePromptForDalle } from './dalle-client';
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
  revisedPrompt?: string;
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
  const client = createDalleClient();

  if (!client) {
    return {
      success: false,
      error: 'DALL-E client not configured (OPENAI_API_KEY missing)',
      timeMs: Date.now() - startTime,
    };
  }

  try {
    // 1. 프롬프트 생성
    const prompt = options.useSimplePrompt
      ? generateSimplePrompt(options)
      : await generateImagePrompt(options);

    // 2. DALL-E용 프롬프트 최적화
    const optimizedPrompt = optimizePromptForDalle(prompt.prompt, options.category);

    // 3. 이미지 생성 기록 생성
     
    const { data: generation, error: insertError } = await (supabase
      .from('image_generations') as any)
      .insert({
        blog_post_id: options.blogPostId,
        prompt: optimizedPrompt,
        negative_prompt: prompt.negativePrompt,
        model: 'dall-e-3',
        status: 'generating',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create image generation record:', insertError);
    }

    // 4. DALL-E 3 API 호출
    const response = await client.generateImage({
      prompt: optimizedPrompt,
      size: '1792x1024', // OG Image에 적합한 가로형
      quality: 'standard',
      style: 'natural',
    });

    if (!response.success || !response.imageUrl) {
      // 실패 기록
      if (generation?.id) {
         
        await (supabase
          .from('image_generations') as any)
          .update({
            status: 'failed',
            error_message: response.error,
          })
          .eq('id', generation.id);
      }

      return {
        success: false,
        prompt,
        error: response.error || 'Image generation failed',
        timeMs: Date.now() - startTime,
      };
    }

    // 5. Supabase Storage에 업로드
    const storedUrl = await uploadToStorage(
      supabase,
      client,
      response.imageUrl,
      options.blogPostId,
      prompt.suggestedFileName
    );

    // 6. 블로그 포스트 업데이트
     
    await (supabase
      .from('blog_posts') as any)
      .update({
        cover_image_url: storedUrl,
        cover_image_alt: prompt.altText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.blogPostId);

    // 7. 생성 기록 완료
    if (generation?.id) {
       
      await (supabase
        .from('image_generations') as any)
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
      prompt,
      revisedPrompt: response.revisedPrompt,
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
   
  const { data: posts, error } = await (supabase
    .from('blog_posts') as any)
    .select('id, title_en, excerpt_en, category')
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
      chunk.map(async (post: { id: string; title_en: string; excerpt_en: string; category: string }) => {
        const pipelineResult = await runImagePipeline(supabase, {
          blogPostId: post.id,
          title: post.title_en || 'Untitled',
          excerpt: post.excerpt_en || '',
          category: post.category || 'general',
          locale: 'en',
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

    // DALL-E rate limit 고려 - 요청 간 딜레이
    if (i + concurrency < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
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
  client: DalleClient,
  imageUrl: string,
  blogPostId: string,
  fileName: string
): Promise<string> {
  try {
    // 이미지 다운로드
    const imageBuffer = await client.downloadImage(imageUrl);

    // 파일 경로 생성
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-z0-9-]/gi, '-').substring(0, 50);
    const filePath = `blog/${blogPostId}/${sanitizedFileName}-${timestamp}.png`;

    // Supabase Storage 업로드
    const { error } = await supabase.storage
      .from('blog-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      // 원본 URL 반환 (폴백) - 단, DALL-E URL은 1시간 후 만료됨
      return imageUrl;
    }

    // Public URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Storage upload failed:', error);
    return imageUrl;
  }
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
      .list(`blog/${blogPostId}`);

    if (files && files.length > 0) {
      const filePaths = files.map(f => `blog/${blogPostId}/${f.name}`);
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

   
  const { data: posts } = await (supabase
    .from('blog_posts') as any)
    .select('id, title_en')
    .eq('status', status)
    .is('cover_image_url', null)
    .limit(limit);

  return (posts || []).map((p: { id: string; title_en: string }) => ({
    id: p.id,
    title: p.title_en,
  }));
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
   
  const { data: post } = await (supabase
    .from('blog_posts') as any)
    .select('cover_image_url')
    .eq('id', blogPostId)
    .single();

  // 최근 생성 기록 확인
   
  const { data: generation } = await (supabase
    .from('image_generations') as any)
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
