/**
 * Content Generation Test Script
 *
 * Tests actual LLM content generation (without images for speed)
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST before any other imports
const envResult = dotenv.config({ path: path.join(__dirname, '../.env.local') });
if (envResult.error) {
  console.error('Failed to load .env.local:', envResult.error);
  process.exit(1);
}

console.log('Environment loaded. API Keys present:');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
console.log('  ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No');

async function testContentGeneration() {
  // Dynamic import after env vars are loaded
  const { generateSingleLanguageContent } = await import('../src/lib/content/single-content-generator');
  type Locale = 'ko' | 'en' | 'ja' | 'zh-CN' | 'zh-TW' | 'th' | 'mn' | 'ru';

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('       Content Generation Test (Without Images)            ');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testCases = [
    {
      keyword: 'Korean rhinoplasty recovery time',
      locale: 'en' as Locale,
      category: 'plastic-surgery',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n🚀 Generating content for: "${testCase.keyword}"`);
    console.log(`   Locale: ${testCase.locale}`);
    console.log(`   Category: ${testCase.category}\n`);

    const startTime = Date.now();

    try {
      const result = await generateSingleLanguageContent({
        keyword: testCase.keyword,
        locale: testCase.locale,
        category: testCase.category,
        includeRAG: false, // Skip RAG for speed
        includeImages: false, // Skip image metadata for speed
        imageCount: 0,
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('                    GENERATION RESULT                       ');
      console.log('═══════════════════════════════════════════════════════════\n');

      console.log(`📝 Title: ${result.title}`);
      console.log(`📖 Excerpt: ${result.excerpt?.substring(0, 100)}...`);
      console.log(`🏷️  Tags: ${result.tags?.join(', ')}`);
      console.log(`\n⏱️  Generation Time: ${duration}s`);
      console.log(`💰 Estimated Cost: $${result.estimatedCost.toFixed(4)}`);

      // Check for Korean text in English content (quality check)
      const koreanRegex = /[\uAC00-\uD7AF]/;
      const hasKorean = koreanRegex.test(result.content);

      console.log(`\n🔍 Quality Checks:`);
      console.log(`   - Content length: ${result.content.length} chars`);
      console.log(`   - Has Korean text: ${hasKorean ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
      console.log(`   - Has title: ${result.title ? '✅' : '❌'}`);
      console.log(`   - Has excerpt: ${result.excerpt ? '✅' : '❌'}`);
      console.log(`   - Has meta title: ${result.metaTitle ? '✅' : '❌'}`);
      console.log(`   - Has meta desc: ${result.metaDescription ? '✅' : '❌'}`);
      console.log(`   - Has FAQ schema: ${result.faqSchema && result.faqSchema.length > 0 ? '✅' : '❌'}`);

      // Check for empty paragraphs
      const emptyParagraphs = (result.content.match(/<p>\s*<\/p>/g) || []).length;
      console.log(`   - Empty paragraphs: ${emptyParagraphs === 0 ? '✅ None' : `❌ ${emptyParagraphs} found`}`);

      // Check author info
      console.log(`\n👤 Author Info:`);
      console.log(`   - Name: ${result.author?.name || 'N/A'}`);
      console.log(`   - Name (EN): ${result.author?.name_en || 'N/A'}`);
      console.log(`   - Years: ${result.author?.years_of_experience || 'N/A'}`);

      // Print content preview
      console.log(`\n📄 Content Preview (first 500 chars):`);
      console.log('---');
      console.log(result.content.substring(0, 500).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
      console.log('---');

      console.log(`\n✅ Content generation successful!`);

    } catch (error: any) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`\n❌ Content generation failed after ${duration}s`);
      console.error(`   Error: ${error.message}`);
      if (error.stack) {
        console.error(`\n   Stack trace:`);
        console.error(error.stack.split('\n').slice(0, 5).join('\n'));
      }
      process.exit(1);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                  TEST COMPLETE                             ');
  console.log('═══════════════════════════════════════════════════════════\n');
}

testContentGeneration().catch(console.error);
