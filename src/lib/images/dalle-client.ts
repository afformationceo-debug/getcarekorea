/**
 * DALL-E 3 API Client
 *
 * OpenAI DALL-E 3 이미지 생성 API 클라이언트
 * - 나노바나나 대체
 * - 고품질 이미지 생성
 */

import OpenAI from 'openai';

// =====================================================
// TYPES
// =====================================================

export interface DalleConfig {
  apiKey: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  revisedPrompt?: string;
  error?: string;
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

// =====================================================
// DALLE CLIENT CLASS
// =====================================================

export class DalleClient {
  private client: OpenAI;

  constructor(config: DalleConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  /**
   * 이미지 생성 요청
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: request.prompt,
        n: 1,
        size: request.size || '1792x1024', // OG Image에 적합한 가로형
        quality: request.quality || 'standard',
        style: request.style || 'natural', // 의료 콘텐츠에 자연스러운 스타일
        response_format: 'url',
      });

      const imageUrl = response.data?.[0]?.url;
      const revisedPrompt = response.data?.[0]?.revised_prompt;

      if (!imageUrl) {
        return {
          success: false,
          error: 'No image URL returned from DALL-E',
        };
      }

      return {
        success: true,
        imageUrl,
        revisedPrompt,
      };
    } catch (error) {
      console.error('DALL-E generation error:', error);

      if (error instanceof OpenAI.APIError) {
        return {
          success: false,
          error: `DALL-E API error: ${error.message}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 이미지 다운로드 (바이너리)
   */
  async downloadImage(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// =====================================================
// DEFAULT PROMPTS
// =====================================================

export const DEFAULT_NEGATIVE_ELEMENTS = [
  'text',
  'watermark',
  'logo',
  'signature',
  'blurry',
  'low quality',
  'distorted',
  'deformed',
  'ugly',
  'cartoon',
  'anime',
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * 환경 변수에서 DALL-E 클라이언트 생성
 */
export function createDalleClient(): DalleClient | null {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OpenAI API key not configured. Skipping image generation.');
    return null;
  }

  return new DalleClient({ apiKey });
}

/**
 * 이미지 URL이 유효한지 확인
 */
export async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && (contentType?.startsWith('image/') || false);
  } catch {
    return false;
  }
}

/**
 * DALL-E 프롬프트 최적화
 * - 의료 관련 이미지에 대한 안전한 프롬프트 생성
 */
export function optimizePromptForDalle(prompt: string, category: string): string {
  // DALL-E는 의료 이미지에 민감할 수 있으므로 안전한 표현 사용
  const safePrompt = prompt
    .replace(/surgery|surgical|operation/gi, 'medical consultation')
    .replace(/patient/gi, 'person')
    .replace(/blood|bleeding/gi, '')
    .replace(/injection|needle/gi, 'treatment');

  // 품질 향상 키워드 추가
  const qualityEnhancements = [
    'professional photography',
    'high quality',
    'clean composition',
    'well-lit',
    'modern interior design',
  ].join(', ');

  return `${safePrompt}. ${qualityEnhancements}. Do not include any text, logos, or watermarks.`;
}
