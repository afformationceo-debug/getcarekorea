/**
 * Test Script: Generate Images with Google Imagen 4
 *
 * ⚠️ IMPORTANT: This script uses Google Imagen 4 for ALL image generation
 * DO NOT use DALL-E, Flux, or other models.
 *
 * Usage: npx tsx scripts/test-imagen4-generation.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import Replicate from 'replicate';

// =====================================================
// CONFIGURATION - DO NOT CHANGE MODEL
// =====================================================

const IMAGEN4_CONFIG = {
  MODEL: 'google/imagen-4' as const,
  COST_PER_IMAGE: 0.02,  // USD
};

// =====================================================
// MAIN TEST FUNCTION
// =====================================================

async function testImagen4Generation() {
  console.log('\n🚀 Testing Google Imagen 4 Image Generation');
  console.log('='.repeat(60));

  // 1. Check API token
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN is not set in .env.local');
    console.log('\n📋 To fix this:');
    console.log('   1. Get your Replicate API token from https://replicate.com/account');
    console.log('   2. Add to .env.local: REPLICATE_API_TOKEN=r8_xxx');
    process.exit(1);
  }

  console.log('\n✅ Replicate API token found');
  console.log(`   Token prefix: ${apiToken.substring(0, 8)}...`);

  // 2. Initialize Replicate client
  const replicate = new Replicate({ auth: apiToken });

  // 3. Check model availability
  console.log('\n📋 Checking Imagen 4 model availability...');
  try {
    const model = await replicate.models.get('google', 'imagen-4');
    console.log(`   ✅ Model: ${model.name}`);
    console.log(`   Description: ${model.description?.substring(0, 100)}...`);
  } catch (error) {
    console.error('❌ Failed to access Imagen 4 model:', error);
    process.exit(1);
  }

  // 4. Test image generation
  console.log('\n🎨 Generating test image with Imagen 4...');
  console.log(`   Model: ${IMAGEN4_CONFIG.MODEL}`);

  const testPrompt = `Ultra-realistic professional photograph, Korean dermatology clinic consultation room. A Korean female dermatologist in white coat explaining Rejuran treatment to an international patient. Modern minimalist interior with warm wood accents and natural sunlight through large windows. Setting: Premium Korean medical clinic in Seoul's Gangnam district. Style: Editorial documentary photography, natural lighting, professional atmosphere. Technical: 8K resolution, sharp focus, natural colors.`;

  console.log(`   Prompt: ${testPrompt.substring(0, 100)}...`);

  const startTime = Date.now();

  try {
    const output = await replicate.run(IMAGEN4_CONFIG.MODEL, {
      input: {
        prompt: testPrompt,
        aspect_ratio: '16:9',
        output_format: 'webp',
        output_quality: 90,
        negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text overlay, cartoon, anime, illustration, 3d render, CGI',
      },
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Extract URL from output
    const imageUrl = typeof output === 'string' ? output :
                     Array.isArray(output) ? String(output[0]) :
                     String(output);

    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.error('❌ Invalid image URL returned:', imageUrl);
      process.exit(1);
    }

    console.log(`\n✅ Image generated successfully!`);
    console.log(`   Time: ${generationTime}s`);
    console.log(`   Cost: $${IMAGEN4_CONFIG.COST_PER_IMAGE.toFixed(3)}`);
    console.log(`   URL: ${imageUrl}`);

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ IMAGEN 4 TEST COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n📸 View your generated image:`);
    console.log(`   ${imageUrl}`);
    console.log(`\n⚠️ Note: This URL will expire after some time.`);
    console.log(`   In production, images are saved to Supabase Storage.`);

  } catch (error) {
    console.error('\n❌ Image generation failed:', error);
    process.exit(1);
  }
}

// Run test
testImagen4Generation().catch(console.error);
