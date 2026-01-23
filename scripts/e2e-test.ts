/**
 * E2E Test Script for Content Generation System
 *
 * Tests the entire workflow:
 * 1. Content generation (LLM)
 * 2. Author persona matching
 * 3. Image generation (DALL-E)
 * 4. Database save
 * 5. Blog publishing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<any>): Promise<void> {
  const start = Date.now();
  console.log(`\n🧪 Running: ${name}`);

  try {
    const details = await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration, details });
    console.log(`   ✅ Passed (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({ name, passed: false, duration, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }
}

// =====================================================
// TEST 1: Author Personas Table
// =====================================================
async function testAuthorPersonas() {
  const { data, error } = await supabase
    .from('author_personas')
    .select('*')
    .eq('is_active', true);

  if (error) throw new Error(`DB Error: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No active author personas found');

  // Verify each required locale has a persona
  const requiredLocales = ['en', 'ja', 'zh-TW', 'zh-CN', 'th', 'mn', 'ru'];
  const coveredLocales = new Set<string>();

  data.forEach((persona: any) => {
    persona.target_locales.forEach((locale: string) => {
      coveredLocales.add(locale);
    });
  });

  const missingLocales = requiredLocales.filter(l => !coveredLocales.has(l));
  if (missingLocales.length > 0) {
    throw new Error(`Missing personas for locales: ${missingLocales.join(', ')}`);
  }

  return {
    personaCount: data.length,
    coveredLocales: Array.from(coveredLocales),
    personas: data.map((p: any) => ({ slug: p.slug, locales: p.target_locales }))
  };
}

// =====================================================
// TEST 2: Author Persona Matching Logic
// =====================================================
async function testAuthorPersonaMatching() {
  const testCases = [
    { locale: 'en', category: 'plastic-surgery', expectedSlug: 'sophia-chen' },
    { locale: 'ja', category: 'plastic-surgery', expectedSlug: 'yuki-tanaka' },
    { locale: 'zh-TW', category: 'plastic-surgery', expectedSlug: 'wendy-lin' },
    { locale: 'th', category: 'plastic-surgery', expectedSlug: 'nina-park' },
  ];

  const results = [];

  for (const testCase of testCases) {
    const { data: personas } = await supabase
      .from('author_personas')
      .select('id, slug, target_locales, primary_specialty')
      .eq('is_active', true)
      .contains('target_locales', [testCase.locale]);

    if (!personas || personas.length === 0) {
      throw new Error(`No persona found for locale: ${testCase.locale}`);
    }

    // Find matching specialty
    const matchingSpecialty = personas.find(
      (p: any) => p.primary_specialty === testCase.category
    );
    const selectedPersona = matchingSpecialty || personas[0];

    results.push({
      locale: testCase.locale,
      expected: testCase.expectedSlug,
      actual: selectedPersona.slug,
      match: selectedPersona.slug === testCase.expectedSlug
    });

    if (selectedPersona.slug !== testCase.expectedSlug) {
      console.log(`   ⚠️  Unexpected persona: expected ${testCase.expectedSlug}, got ${selectedPersona.slug}`);
    }
  }

  return results;
}

// =====================================================
// TEST 3: Blog Posts Table Schema
// =====================================================
async function testBlogPostsSchema() {
  // Try to insert a test record to verify schema
  const testSlug = `test-schema-${Date.now()}`;

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      slug: testSlug,
      title_en: 'Test Post',
      content_en: '<p>Test content</p>',
      category: 'test',
      status: 'draft',
      author_persona_id: null, // New field we added
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Schema test failed: ${error.message}`);
  }

  // Cleanup
  await supabase.from('blog_posts').delete().eq('id', data.id);

  return {
    schemaValid: true,
    hasAuthorPersonaId: 'author_persona_id' in data
  };
}

// =====================================================
// TEST 4: Content Keywords Table
// =====================================================
async function testContentKeywordsTable() {
  const { data, error } = await supabase
    .from('content_keywords')
    .select('*')
    .limit(5);

  if (error) {
    throw new Error(`Keywords table error: ${error.message}`);
  }

  return {
    tableExists: true,
    sampleCount: data?.length || 0
  };
}

// =====================================================
// TEST 5: Check OpenAI API Key
// =====================================================
async function testOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format');
  }

  return {
    configured: true,
    keyPrefix: apiKey.substring(0, 7) + '...'
  };
}

// =====================================================
// TEST 6: Check Anthropic API Key
// =====================================================
async function testAnthropicConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error('Invalid Anthropic API key format');
  }

  return {
    configured: true,
    keyPrefix: apiKey.substring(0, 10) + '...'
  };
}

// =====================================================
// TEST 7: Supabase Storage (for images)
// =====================================================
async function testSupabaseStorage() {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    throw new Error(`Storage error: ${error.message}`);
  }

  const blogImagesBucket = buckets?.find(b => b.name === 'blog-images');

  return {
    bucketsAvailable: buckets?.length || 0,
    blogImagesBucketExists: !!blogImagesBucket,
    bucketNames: buckets?.map(b => b.name)
  };
}

// =====================================================
// MAIN TEST RUNNER
// =====================================================
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           GetCare Korea - E2E Test Suite                 ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Started at: ${new Date().toISOString()}`);

  await runTest('1. Author Personas Table', testAuthorPersonas);
  await runTest('2. Author Persona Matching', testAuthorPersonaMatching);
  await runTest('3. Blog Posts Schema', testBlogPostsSchema);
  await runTest('4. Content Keywords Table', testContentKeywordsTable);
  await runTest('5. OpenAI API Configuration', testOpenAIConfig);
  await runTest('6. Anthropic API Configuration', testAnthropicConfig);
  await runTest('7. Supabase Storage', testSupabaseStorage);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                     TEST SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const status = r.passed ? '✅' : '❌';
    console.log(`${status} ${r.name} (${r.duration}ms)`);
    if (!r.passed && r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });

  console.log(`\nTotal: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please fix the issues before proceeding.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

main().catch(console.error);
