/**
 * Image Generation Test Script
 *
 * Tests DALL-E image generation and injection
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testImageGeneration() {
  const { generateImages, injectImagesIntoHTML } = await import('../src/lib/content/image-helper');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('           Image Generation Test (DALL-E 3)                ');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test with a single photorealistic image prompt
  const testImages = [
    {
      position: 'after-intro',
      placeholder: '[IMAGE_PLACEHOLDER_1]',
      prompt: 'Professional photograph of a Korean plastic surgery clinic consultation room in Gangnam, Seoul. A female Korean doctor in white coat consults with an international patient (Caucasian woman, 30s). Modern minimalist interior with natural lighting from large windows, white walls, light wood accents. Shot with Canon EOS R5, 35mm lens, f/2.8. Magazine quality documentary photography.',
      alt: 'Korean rhinoplasty consultation at a Gangnam clinic with doctor and patient',
    }
  ];

  console.log('🎨 Generating 1 test image...\n');
  const startTime = Date.now();

  try {
    const result = await generateImages({
      images: testImages,
      keyword: 'Korean rhinoplasty',
      locale: 'en',
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    IMAGE GENERATION RESULT                 ');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`⏱️  Generation Time: ${duration}s`);
    console.log(`💰 Total Cost: $${result.total_cost.toFixed(4)}`);
    console.log(`✅ Images Generated: ${result.images.length}`);
    console.log(`❌ Errors: ${result.errors.length}`);

    if (result.images.length > 0) {
      console.log('\n📸 Generated Images:');
      result.images.forEach((img: any, i: number) => {
        console.log(`\n   Image ${i + 1}:`);
        console.log(`   - Position: ${img.position || 'N/A'}`);
        console.log(`   - URL: ${img.url?.substring(0, 80)}...`);
        console.log(`   - Alt: ${img.alt}`);
      });
    }

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach((err: any, i: number) => {
        console.log(`   ${i + 1}. ${err.position}: ${err.error}`);
      });
    }

    // Test HTML injection
    if (result.images.length > 0) {
      console.log('\n\n🔗 Testing HTML Injection...');

      const testHTML = `
<p>Welcome to our guide on Korean rhinoplasty.</p>
<img src="[IMAGE_PLACEHOLDER_1]" alt="placeholder" />
<p>Here's what you need to know about recovery.</p>
      `;

      const injectedHTML = injectImagesIntoHTML(testHTML, result.images);

      console.log('\n   Before injection:');
      console.log('   ' + testHTML.trim().substring(0, 100) + '...');

      console.log('\n   After injection:');
      console.log('   ' + injectedHTML.trim().substring(0, 200) + '...');

      const hasPlaceholder = injectedHTML.includes('[IMAGE_PLACEHOLDER');
      console.log(`\n   Placeholder removed: ${!hasPlaceholder ? '✅' : '❌'}`);
      console.log(`   Has real URL: ${injectedHTML.includes('https://') ? '✅' : '❌'}`);
    }

    console.log('\n✅ Image generation test complete!');

  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\n❌ Image generation failed after ${duration}s`);
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                  TEST COMPLETE                             ');
  console.log('═══════════════════════════════════════════════════════════\n');
}

testImageGeneration().catch(console.error);
