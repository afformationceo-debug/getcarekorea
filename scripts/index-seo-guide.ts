/**
 * Google SEO Guide Indexing Script
 *
 * This script indexes the Google SEO guide into Upstash Vector DB
 * for RAG (Retrieval Augmented Generation) during content creation.
 *
 * Usage:
 *   npx tsx scripts/index-seo-guide.ts
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { Index } from '@upstash/vector';

// =====================================================
// CONFIG
// =====================================================

const SEO_GUIDE_PATH = path.join(process.cwd(), 'docs', 'google-seo-guide.md');
const CHUNK_SIZE = 500; // tokens per chunk
const CHUNK_OVERLAP = 50; // overlap between chunks

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Upstash Vector
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// =====================================================
// TYPES
// =====================================================

interface Chunk {
  id: string;
  text: string;
  metadata: {
    source: 'google-seo-guide';
    section: string;
    subsection?: string;
    priority: number; // 1-10, higher = more important
    keywords: string[];
    type: 'guideline' | 'example' | 'checklist' | 'definition';
  };
}

// =====================================================
// TEXT CHUNKING
// =====================================================

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks based on sections
 */
function splitIntoChunks(content: string): Chunk[] {
  const chunks: Chunk[] = [];

  // Split by major sections (## headers)
  const sections = content.split(/^## /gm).filter(s => s.trim().length > 0);

  let chunkId = 0;

  for (const sectionText of sections) {
    const lines = sectionText.split('\n');
    const sectionTitle = lines[0].trim();
    const sectionContent = lines.slice(1).join('\n').trim();

    // Determine section priority
    const priority = determinePriority(sectionTitle);

    // Split by subsections (### headers) or by size
    const subsections = sectionContent.split(/^### /gm).filter(s => s.trim().length > 0);

    if (subsections.length > 1) {
      // Has subsections
      for (const subsectionText of subsections) {
        const subLines = subsectionText.split('\n');
        const subsectionTitle = subLines[0].trim();
        const subsectionContent = subLines.slice(1).join('\n').trim();

        // Further split if too large
        const textChunks = splitBySize(subsectionContent, CHUNK_SIZE, CHUNK_OVERLAP);

        for (let i = 0; i < textChunks.length; i++) {
          chunks.push({
            id: `seo-guide-${chunkId++}`,
            text: textChunks[i],
            metadata: {
              source: 'google-seo-guide',
              section: sectionTitle,
              subsection: subsectionTitle,
              priority,
              keywords: extractKeywords(textChunks[i]),
              type: determineType(textChunks[i]),
            },
          });
        }
      }
    } else {
      // No subsections, split by size
      const textChunks = splitBySize(sectionContent, CHUNK_SIZE, CHUNK_OVERLAP);

      for (let i = 0; i < textChunks.length; i++) {
        chunks.push({
          id: `seo-guide-${chunkId++}`,
          text: textChunks[i],
          metadata: {
            source: 'google-seo-guide',
            section: sectionTitle,
            priority,
            keywords: extractKeywords(textChunks[i]),
            type: determineType(textChunks[i]),
          },
        });
      }
    }
  }

  return chunks;
}

/**
 * Split text by token size with overlap
 */
function splitBySize(text: string, maxTokens: number, overlap: number): string[] {
  const sentences = text.split(/[.!?]\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      // Save current chunk
      chunks.push(currentChunk.join('. ') + '.');

      // Start new chunk with overlap
      const overlapSentences = currentChunk.slice(-Math.ceil(overlap / 100));
      currentChunk = overlapSentences;
      currentTokens = overlapSentences.reduce((sum, s) => sum + estimateTokens(s), 0);
    }

    currentChunk.push(sentence);
    currentTokens += sentenceTokens;
  }

  // Add last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('. ') + '.');
  }

  return chunks.filter(c => c.trim().length > 0);
}

/**
 * Determine section priority based on title
 */
function determinePriority(sectionTitle: string): number {
  const lowerTitle = sectionTitle.toLowerCase();

  // High priority sections
  if (
    lowerTitle.includes('e-e-a-t') ||
    lowerTitle.includes('콘텐츠 품질') ||
    lowerTitle.includes('ymyl') ||
    lowerTitle.includes('aeo') ||
    lowerTitle.includes('검색 결과')
  ) {
    return 10;
  }

  // Medium-high priority
  if (
    lowerTitle.includes('제목') ||
    lowerTitle.includes('title') ||
    lowerTitle.includes('메타') ||
    lowerTitle.includes('meta') ||
    lowerTitle.includes('구조화') ||
    lowerTitle.includes('이미지') ||
    lowerTitle.includes('콘텐츠 작성')
  ) {
    return 8;
  }

  // Medium priority
  if (
    lowerTitle.includes('url') ||
    lowerTitle.includes('사이트 구성') ||
    lowerTitle.includes('링크') ||
    lowerTitle.includes('모바일')
  ) {
    return 6;
  }

  // Lower priority
  return 4;
}

/**
 * Determine chunk type
 */
function determineType(text: string): 'guideline' | 'example' | 'checklist' | 'definition' {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('예시:') || lowerText.includes('example:') || text.includes('```')) {
    return 'example';
  }

  if (lowerText.includes('체크리스트') || lowerText.includes('checklist') || /^[-•✓]\s/.test(text)) {
    return 'checklist';
  }

  if (lowerText.includes('이란') || lowerText.includes('정의') || lowerText.includes('definition')) {
    return 'definition';
  }

  return 'guideline';
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();

  // Common SEO keywords
  const seoKeywords = [
    'seo', 'title', 'meta', 'description', 'keywords', 'content', 'quality',
    'e-e-a-t', 'ymyl', 'aeo', 'schema', 'structured data', 'image', 'alt',
    'url', 'link', 'internal', 'external', 'mobile', 'speed', 'performance',
    '제목', '메타', '설명', '콘텐츠', '품질', '이미지', '링크', '모바일', '속도',
  ];

  const lowerText = text.toLowerCase();
  for (const keyword of seoKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      keywords.add(keyword);
    }
  }

  return Array.from(keywords);
}

// =====================================================
// EMBEDDING & INDEXING
// =====================================================

/**
 * Create embedding for text using OpenAI
 */
async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Index chunks into Upstash Vector
 */
async function indexChunks(chunks: Chunk[]): Promise<void> {
  console.log(`\n📝 Indexing ${chunks.length} chunks...`);

  const batchSize = 10; // Process in batches

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`\n  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);

    const vectors = await Promise.all(
      batch.map(async (chunk) => {
        const embedding = await createEmbedding(chunk.text);

        console.log(`    ✓ ${chunk.id}: ${chunk.metadata.section.substring(0, 40)}...`);

        return {
          id: chunk.id,
          vector: embedding,
          metadata: {
            ...chunk.metadata,
            text: chunk.text, // Store text in metadata for retrieval
          },
        };
      })
    );

    // Upsert to Upstash Vector
    await vectorIndex.upsert(vectors);

    console.log(`    ✅ Batch uploaded`);

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ All chunks indexed successfully!`);
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('🚀 Google SEO Guide Indexing Script');
  console.log('=====================================\n');

  // Read SEO guide
  console.log(`📖 Reading SEO guide from: ${SEO_GUIDE_PATH}`);
  const content = fs.readFileSync(SEO_GUIDE_PATH, 'utf-8');
  console.log(`   File size: ${(content.length / 1024).toFixed(2)} KB`);

  // Split into chunks
  console.log('\n✂️  Splitting into chunks...');
  const chunks = splitIntoChunks(content);
  console.log(`   Total chunks: ${chunks.length}`);
  console.log(`   Avg tokens per chunk: ${Math.round(chunks.reduce((sum, c) => sum + estimateTokens(c.text), 0) / chunks.length)}`);

  // Show chunk distribution by section
  const sectionCounts = chunks.reduce((acc, c) => {
    acc[c.metadata.section] = (acc[c.metadata.section] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n   Chunks by section:');
  Object.entries(sectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([section, count]) => {
      console.log(`     - ${section.substring(0, 40)}: ${count} chunks`);
    });

  // Show priority distribution
  const priorityCounts = chunks.reduce((acc, c) => {
    acc[c.metadata.priority] = (acc[c.metadata.priority] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  console.log('\n   Chunks by priority:');
  Object.entries(priorityCounts)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([priority, count]) => {
      console.log(`     - Priority ${priority}: ${count} chunks`);
    });

  // Index chunks
  await indexChunks(chunks);

  // Test query
  console.log('\n🔍 Testing retrieval...');
  const testQuery = 'How to write good title tags for SEO?';
  const testEmbedding = await createEmbedding(testQuery);
  const results = await vectorIndex.query({
    vector: testEmbedding,
    topK: 3,
    includeMetadata: true,
  });

  console.log(`   Query: "${testQuery}"`);
  console.log(`   Found ${results.length} results:\n`);

  results.forEach((result, idx) => {
    console.log(`   ${idx + 1}. [Score: ${result.score?.toFixed(3)}] ${result.metadata?.section}`);
    console.log(`      ${(result.metadata?.text as string)?.substring(0, 100)}...`);
  });

  console.log('\n✅ Indexing complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Total chunks indexed: ${chunks.length}`);
  console.log(`   - Vector dimensions: 1536 (text-embedding-3-small)`);
  console.log(`   - Ready for RAG in content generation!\n`);
}

// Run
main().catch(console.error);
