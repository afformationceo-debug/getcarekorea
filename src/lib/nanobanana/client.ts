/**
 * Nanobanana API Client
 *
 * 나노바나나 이미지 생성 API 클라이언트
 * - 이미지 생성 요청
 * - 생성 상태 확인
 * - 결과 이미지 다운로드
 */

// =====================================================
// TYPES
// =====================================================

export interface NanobananaConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: ImageStyle;
  numImages?: number;
}

export type ImageStyle =
  | 'photorealistic'
  | 'digital-art'
  | 'illustration'
  | 'anime'
  | 'cinematic'
  | 'minimalist';

export interface ImageGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  images?: GeneratedImage[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  seed?: number;
}

export interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  estimatedTimeRemaining?: number;
  images?: GeneratedImage[];
  error?: string;
}

// =====================================================
// NANOBANANA CLIENT CLASS
// =====================================================

export class NanobananaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: NanobananaConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.nanobanana.com/v1';
  }

  /**
   * 이미지 생성 요청
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || DEFAULT_NEGATIVE_PROMPT,
        width: request.width || 1200,
        height: request.height || 630, // OG Image 비율
        style: request.style || 'photorealistic',
        num_images: request.numImages || 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Nanobanana API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      images: data.images,
      createdAt: data.created_at,
    };
  }

  /**
   * 생성 상태 확인
   */
  async getGenerationStatus(generationId: string): Promise<GenerationStatus> {
    const response = await fetch(`${this.baseUrl}/generate/${generationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Nanobanana API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      progress: data.progress,
      estimatedTimeRemaining: data.estimated_time_remaining,
      images: data.images,
      error: data.error,
    };
  }

  /**
   * 이미지 생성 완료까지 대기 (폴링)
   */
  async waitForCompletion(
    generationId: string,
    options: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (status: GenerationStatus) => void;
    } = {}
  ): Promise<GenerationStatus> {
    const { maxWaitMs = 120000, pollIntervalMs = 2000, onProgress } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getGenerationStatus(generationId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Image generation timed out after ${maxWaitMs}ms`);
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

const DEFAULT_NEGATIVE_PROMPT = [
  'blurry',
  'low quality',
  'distorted',
  'deformed',
  'ugly',
  'bad anatomy',
  'text',
  'watermark',
  'signature',
  'logo',
  'cartoon',
  'anime',
  'illustration',
  'painting',
  'drawing',
  'sketch',
].join(', ');

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * 환경 변수에서 나노바나나 클라이언트 생성
 */
export function createNanobananaClient(): NanobananaClient | null {
  const apiKey = process.env.NANOBANANA_API_KEY;

  if (!apiKey) {
    console.warn('Nanobanana API key not configured. Skipping image generation.');
    return null;
  }

  return new NanobananaClient({ apiKey });
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
