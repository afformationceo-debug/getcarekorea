/**
 * Google Imagen 4 API Client
 *
 * ⚠️ IMPORTANT: This is the OFFICIAL image generation client for GetCareKorea
 * DO NOT use DALL-E, Flux, or other models.
 *
 * Uses Replicate API to access Google Imagen 4
 * @see https://replicate.com/google/imagen-4/api
 */

import Replicate from 'replicate';

// =====================================================
// CONFIGURATION - DO NOT CHANGE
// =====================================================

export const IMAGEN4_CONFIG = {
  MODEL: 'google/imagen-4' as const,
  COST_PER_IMAGE: 0.02,              // USD
  MAX_CONCURRENT: 3,
  TIMEOUT_MS: 120000,                // 2 minutes
  DEFAULT_ASPECT_RATIO: '16:9',
  DEFAULT_FORMAT: 'webp',
  DEFAULT_QUALITY: 90,
};

// =====================================================
// TYPES
// =====================================================

export interface Imagen4Config {
  apiToken?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  outputFormat?: 'webp' | 'jpg' | 'png';
  outputQuality?: number;
  negativePrompt?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

// =====================================================
// IMAGEN4 CLIENT CLASS
// =====================================================

export class Imagen4Client {
  private client: Replicate;

  constructor(config?: Imagen4Config) {
    const apiToken = config?.apiToken || process.env.REPLICATE_API_TOKEN;

    if (!apiToken) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    this.client = new Replicate({
      auth: apiToken,
    });
  }

  /**
   * 이미지 생성 요청
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      // Enhance prompt for medical tourism context
      const enhancedPrompt = this.enhancePrompt(request.prompt);

      console.log(`   📷 Imagen 4: Generating image...`);
      console.log(`      Prompt: ${request.prompt.substring(0, 80)}...`);

      const output = await this.client.run(IMAGEN4_CONFIG.MODEL, {
        input: {
          prompt: enhancedPrompt,
          aspect_ratio: request.aspectRatio || IMAGEN4_CONFIG.DEFAULT_ASPECT_RATIO,
          output_format: request.outputFormat || IMAGEN4_CONFIG.DEFAULT_FORMAT,
          output_quality: request.outputQuality || IMAGEN4_CONFIG.DEFAULT_QUALITY,
          negative_prompt: request.negativePrompt ||
            'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text overlay, cartoon, anime, illustration, 3d render, CGI',
        },
      });

      // Extract URL from output
      const imageUrl = typeof output === 'string' ? output :
                       Array.isArray(output) ? String(output[0]) :
                       String(output);

      if (!imageUrl || !imageUrl.startsWith('http')) {
        return {
          success: false,
          error: `Invalid image URL returned: ${imageUrl}`,
        };
      }

      console.log(`   ✅ Imagen 4: Generated successfully`);

      return {
        success: true,
        imageUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Imagen 4 error:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 배치 이미지 생성
   */
  async generateBatch(
    requests: ImageGenerationRequest[],
    options?: { maxConcurrent?: number }
  ): Promise<ImageGenerationResponse[]> {
    const maxConcurrent = options?.maxConcurrent || IMAGEN4_CONFIG.MAX_CONCURRENT;
    const results: ImageGenerationResponse[] = [];

    console.log(`\n🎨 Imagen 4: Generating ${requests.length} images (batch size: ${maxConcurrent})`);

    // Process in batches
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      const batchNum = Math.floor(i / maxConcurrent) + 1;
      const totalBatches = Math.ceil(requests.length / maxConcurrent);

      console.log(`\n   📦 Batch ${batchNum}/${totalBatches}`);

      const batchResults = await Promise.all(
        batch.map(req => this.generateImage(req))
      );

      results.push(...batchResults);

      // Delay between batches
      if (i + maxConcurrent < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ Imagen 4 batch complete: ${successCount}/${requests.length} succeeded`);

    return results;
  }

  /**
   * 프롬프트 향상 (의료 관광 컨텍스트 추가)
   */
  private enhancePrompt(basePrompt: string): string {
    // Photography style prefix
    const stylePrefix = 'Ultra-realistic professional photograph, ';

    // Medical tourism context suffix
    const contextSuffix = `. Setting: Premium Korean medical clinic in Seoul's Gangnam district. Style: Editorial documentary photography, natural lighting, professional atmosphere. Technical: 8K resolution, sharp focus, natural colors.`;

    return stylePrefix + basePrompt + contextSuffix;
  }

  /**
   * 모델 사용 가능 여부 확인
   */
  async checkAvailability(): Promise<{ available: boolean; message: string }> {
    try {
      await this.client.models.get('google', 'imagen-4');
      return {
        available: true,
        message: `Imagen 4 (${IMAGEN4_CONFIG.MODEL}) is available`,
      };
    } catch (error) {
      return {
        available: false,
        message: `Imagen 4 check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

let imagen4ClientInstance: Imagen4Client | null = null;

export function getImagen4Client(): Imagen4Client {
  if (!imagen4ClientInstance) {
    imagen4ClientInstance = new Imagen4Client();
  }
  return imagen4ClientInstance;
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

/**
 * 단일 이미지 생성 (간편 함수)
 */
export async function generateImage(
  prompt: string,
  options?: Omit<ImageGenerationRequest, 'prompt'>
): Promise<ImageGenerationResponse> {
  const client = getImagen4Client();
  return client.generateImage({ prompt, ...options });
}

/**
 * 배치 이미지 생성 (간편 함수)
 */
export async function generateBatchImages(
  prompts: string[],
  options?: Omit<ImageGenerationRequest, 'prompt'>
): Promise<ImageGenerationResponse[]> {
  const client = getImagen4Client();
  const requests = prompts.map(prompt => ({ prompt, ...options }));
  return client.generateBatch(requests);
}
