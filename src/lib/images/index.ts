/**
 * Images Module Exports
 *
 * ⚠️ IMPORTANT: GetCareKorea uses Google Imagen 4 for ALL image generation
 * DO NOT use DALL-E, Flux, or other models.
 *
 * Model: google/imagen-4 (via Replicate API)
 * @see https://replicate.com/google/imagen-4/api
 */

// =====================================================
// OFFICIAL: Google Imagen 4 Client & Pipeline
// =====================================================
export * from './imagen4-client';
export * from './imagen4-pipeline';

// Legacy exports (deprecated - DO NOT use for new code)
// export * from './dalle-client';
// export * from './prompt-generator';
// export * from './image-pipeline';
