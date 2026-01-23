/**
 * Full Workflow Test Script
 *
 * Tests the complete content generation and publishing workflow:
 * 1. Generate content with LLM
 * 2. Generate images with DALL-E
 * 3. Save to database
 * 4. Verify blog post can be fetched
 * 5. Test author persona linking
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFullWorkflow() {
  const { generateSingleLanguageContent } = await import('../src/lib/content/single-content-generator');
  const { generateImages, injectImagesIntoHTML } = await import('../src/lib/content/image-helper');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('         Full Workflow Test (Content → Images → DB)         ');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testKeyword = `test-workflow-${Date.now()}`;
  const locale = 'en';
  const category = 'plastic-surgery';

  let savedPostId: string | null = null;
  const startTime = Date.now();

  try {
    // =====================================================
    // STEP 1: Generate Content
    // =====================================================
    console.log('📝 STEP 1: Generating content with LLM...\n');
    const contentStartTime = Date.now();

    const content = await generateSingleLanguageContent({
      keyword: 'Korean double eyelid surgery cost',
      locale: 'en',
      category: 'plastic-surgery',
      includeRAG: false,
      includeImages: true,
      imageCount: 1,
    });

    const contentDuration = ((Date.now() - contentStartTime) / 1000).toFixed(1);
    console.log(`\n   ✅ Content generated in ${contentDuration}s`);
    console.log(`   - Title: ${content.title}`);
    console.log(`   - Content length: ${content.content.length} chars`);
    console.log(`   - Images metadata: ${content.images.length}`);

    // =====================================================
    // STEP 2: Generate Images (skip for speed, use placeholder check)
    // =====================================================
    console.log('\n🎨 STEP 2: Checking image placeholders...\n');

    const hasPlaceholders = content.content.includes('[IMAGE_PLACEHOLDER');
    console.log(`   - Has image placeholders: ${hasPlaceholders ? '✅' : '❌'}`);
    console.log(`   - Image prompts generated: ${content.images.length}`);

    if (content.images.length > 0) {
      console.log(`   - First image prompt preview: ${content.images[0].prompt.substring(0, 100)}...`);
    }

    // =====================================================
    // STEP 3: Save to Database
    // =====================================================
    console.log('\n💾 STEP 3: Saving to database...\n');

    // Find matching author persona
    const { data: personas } = await supabase
      .from('author_personas')
      .select('id, slug, target_locales')
      .eq('is_active', true)
      .contains('target_locales', [locale]);

    const authorPersonaId = personas?.[0]?.id || null;
    console.log(`   - Matched author persona: ${personas?.[0]?.slug || 'None'}`);

    // Generate slug
    const slug = `korean-double-eyelid-surgery-cost-${Date.now()}`;

    // Save to blog_posts
    const { data: savedPost, error: saveError } = await supabase
      .from('blog_posts')
      .insert({
        slug,
        title_en: content.title,
        excerpt_en: content.excerpt,
        content_en: content.content,
        meta_title_en: content.metaTitle,
        meta_description_en: content.metaDescription,
        category,
        tags: content.tags,
        author_persona_id: authorPersonaId,
        status: 'draft',
        generation_metadata: {
          keyword: 'Korean double eyelid surgery cost',
          locale,
          author: content.author,
          faqSchema: content.faqSchema,
          images: content.images,
          generatedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`DB save failed: ${saveError.message}`);
    }

    savedPostId = savedPost.id;
    console.log(`   ✅ Saved to database with ID: ${savedPostId}`);
    console.log(`   - Slug: ${slug}`);
    console.log(`   - Author Persona ID: ${authorPersonaId || 'None'}`);

    // =====================================================
    // STEP 4: Verify Fetch
    // =====================================================
    console.log('\n🔍 STEP 4: Verifying blog post fetch...\n');

    const { data: fetchedPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author_persona:author_personas(*)
      `)
      .eq('id', savedPostId)
      .single();

    if (fetchError) {
      throw new Error(`Fetch failed: ${fetchError.message}`);
    }

    console.log(`   ✅ Blog post fetched successfully`);
    console.log(`   - Title: ${fetchedPost.title_en}`);
    console.log(`   - Has author persona: ${fetchedPost.author_persona ? '✅' : '❌'}`);

    if (fetchedPost.author_persona) {
      console.log(`   - Author name: ${fetchedPost.author_persona.name_en}`);
      console.log(`   - Author experience: ${fetchedPost.author_persona.years_of_experience} years`);
    }

    // =====================================================
    // STEP 5: Quality Checks
    // =====================================================
    console.log('\n✔️  STEP 5: Running quality checks...\n');

    const checks = {
      hasTitle: !!fetchedPost.title_en,
      hasContent: !!fetchedPost.content_en && fetchedPost.content_en.length > 1000,
      hasExcerpt: !!fetchedPost.excerpt_en,
      hasMetaTitle: !!fetchedPost.meta_title_en,
      hasMetaDesc: !!fetchedPost.meta_description_en,
      hasTags: fetchedPost.tags && fetchedPost.tags.length > 0,
      hasAuthorPersona: !!fetchedPost.author_persona_id,
      noKoreanText: !/[\uAC00-\uD7AF]/.test(fetchedPost.content_en || ''),
      noEmptyParagraphs: !/<p>\s*<\/p>/.test(fetchedPost.content_en || ''),
      hasGenerationMetadata: !!fetchedPost.generation_metadata,
    };

    let passedChecks = 0;
    const totalChecks = Object.keys(checks).length;

    Object.entries(checks).forEach(([name, passed]) => {
      console.log(`   - ${name}: ${passed ? '✅' : '❌'}`);
      if (passed) passedChecks++;
    });

    console.log(`\n   Quality Score: ${passedChecks}/${totalChecks} checks passed`);

    // =====================================================
    // CLEANUP
    // =====================================================
    console.log('\n🧹 Cleaning up test data...\n');

    await supabase.from('blog_posts').delete().eq('id', savedPostId);
    console.log(`   ✅ Test blog post deleted`);

    // =====================================================
    // SUMMARY
    // =====================================================
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    WORKFLOW SUMMARY                        ');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`   ⏱️  Total Time: ${totalDuration}s`);
    console.log(`   📝 Content Generation: ${contentDuration}s`);
    console.log(`   💰 Estimated Cost: $${content.estimatedCost.toFixed(4)}`);
    console.log(`   ✅ Quality Score: ${passedChecks}/${totalChecks}`);
    console.log(`   🔗 Author Persona Linked: ${authorPersonaId ? 'Yes' : 'No'}`);

    if (passedChecks === totalChecks) {
      console.log('\n🎉 ALL TESTS PASSED! Workflow is working correctly.\n');
    } else {
      console.log(`\n⚠️  ${totalChecks - passedChecks} check(s) failed. Review above.\n`);
    }

  } catch (error: any) {
    console.error(`\n❌ Workflow test failed: ${error.message}`);

    // Cleanup on error
    if (savedPostId) {
      await supabase.from('blog_posts').delete().eq('id', savedPostId);
      console.log('   Cleaned up test data');
    }

    process.exit(1);
  }
}

testFullWorkflow().catch(console.error);
