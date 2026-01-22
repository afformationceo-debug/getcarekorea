import { Index } from '@upstash/vector';

// Lazy initialize Vector index to avoid build-time errors
let _vectorIndex: Index | null = null;

function getVectorIndex(): Index {
  if (!_vectorIndex) {
    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      throw new Error('Upstash Vector credentials not configured');
    }
    _vectorIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });
  }
  return _vectorIndex;
}

// Export getter for backward compatibility
export const vectorIndex = {
  query: (...args: Parameters<Index['query']>) => getVectorIndex().query(...args),
  upsert: (...args: Parameters<Index['upsert']>) => getVectorIndex().upsert(...args),
  delete: (...args: Parameters<Index['delete']>) => getVectorIndex().delete(...args),
};

// =====================================================
// NAMESPACES
// =====================================================

export const VECTOR_NAMESPACES = {
  hospitals: 'hospitals',
  procedures: 'procedures',
  blogPosts: 'blog-posts',
  faq: 'faq',
  llmFeedback: 'llm-feedback',
} as const;

export type VectorNamespace = (typeof VECTOR_NAMESPACES)[keyof typeof VECTOR_NAMESPACES];

// =====================================================
// EMBEDDING GENERATION
// =====================================================

interface EmbeddingOptions {
  model?: string;
}

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generate embeddings using OpenAI
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]> {
  const { model = DEFAULT_EMBEDDING_MODEL } = options;

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(
  texts: string[],
  options: EmbeddingOptions = {}
): Promise<number[][]> {
  const { model = DEFAULT_EMBEDDING_MODEL } = options;

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

// =====================================================
// VECTOR OPERATIONS
// =====================================================

interface VectorMetadata {
  id: string;
  type: string;
  locale?: string;
  [key: string]: unknown;
}

interface UpsertVectorOptions {
  namespace: VectorNamespace;
  id: string;
  text: string;
  metadata: VectorMetadata;
}

/**
 * Upsert a vector with embedding
 */
export async function upsertVector(options: UpsertVectorOptions): Promise<void> {
  const { namespace, id, text, metadata } = options;

  const embedding = await generateEmbedding(text);

  await vectorIndex.upsert({
    id,
    vector: embedding,
    metadata: {
      ...metadata,
      text: text.slice(0, 1000), // Store truncated text for reference
    },
  }, { namespace });
}

/**
 * Upsert multiple vectors
 */
export async function upsertVectors(
  namespace: VectorNamespace,
  items: Array<{ id: string; text: string; metadata: VectorMetadata }>
): Promise<void> {
  const texts = items.map((item) => item.text);
  const embeddings = await generateEmbeddings(texts);

  const vectors = items.map((item, index) => ({
    id: item.id,
    vector: embeddings[index],
    metadata: {
      ...item.metadata,
      text: item.text.slice(0, 1000),
    },
  }));

  await vectorIndex.upsert(vectors, { namespace });
}

interface QueryVectorOptions {
  namespace: VectorNamespace;
  query: string;
  topK?: number;
  filter?: string;
  includeMetadata?: boolean;
  includeVectors?: boolean;
}

interface QueryResult {
  id: string;
  score: number;
  metadata?: VectorMetadata & { text?: string };
}

/**
 * Query vectors by semantic similarity
 */
export async function queryVectors(options: QueryVectorOptions): Promise<QueryResult[]> {
  const {
    namespace,
    query,
    topK = 5,
    filter,
    includeMetadata = true,
    includeVectors = false,
  } = options;

  const embedding = await generateEmbedding(query);

  const results = await vectorIndex.query({
    vector: embedding,
    topK,
    filter,
    includeMetadata,
    includeVectors,
  }, { namespace });

  return results.map((result) => ({
    id: result.id as string,
    score: result.score,
    metadata: result.metadata as VectorMetadata & { text?: string },
  }));
}

/**
 * Delete a vector
 */
export async function deleteVector(
  namespace: VectorNamespace,
  id: string
): Promise<void> {
  await vectorIndex.delete(id, { namespace });
}

/**
 * Delete multiple vectors
 */
export async function deleteVectors(
  namespace: VectorNamespace,
  ids: string[]
): Promise<void> {
  await vectorIndex.delete(ids, { namespace });
}

// =====================================================
// HOSPITAL VECTORS
// =====================================================

interface HospitalVectorData {
  id: string;
  name: string;
  description: string;
  specialties: string[];
  city: string;
  locale: string;
}

export async function indexHospital(hospital: HospitalVectorData): Promise<void> {
  const text = [
    hospital.name,
    hospital.description,
    hospital.specialties.join(', '),
    hospital.city,
  ].join(' | ');

  await upsertVector({
    namespace: VECTOR_NAMESPACES.hospitals,
    id: `hospital:${hospital.id}:${hospital.locale}`,
    text,
    metadata: {
      id: hospital.id,
      type: 'hospital',
      locale: hospital.locale,
      specialties: hospital.specialties,
      city: hospital.city,
    },
  });
}

/**
 * Build a filter string for Upstash Vector queries
 */
function buildFilterString(conditions: Record<string, string | undefined>): string | undefined {
  const parts = Object.entries(conditions)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([key, value]) => `${key} = '${value}'`);

  return parts.length > 0 ? parts.join(' AND ') : undefined;
}

export async function searchHospitals(
  query: string,
  options: {
    locale?: string;
    specialties?: string[];
    city?: string;
    topK?: number;
  } = {}
): Promise<QueryResult[]> {
  const { locale, city, topK = 10 } = options;

  const filter = buildFilterString({
    type: 'hospital',
    locale,
    city,
  });

  return queryVectors({
    namespace: VECTOR_NAMESPACES.hospitals,
    query,
    topK,
    filter,
  });
}

// =====================================================
// PROCEDURE VECTORS
// =====================================================

interface ProcedureVectorData {
  id: string;
  name: string;
  description: string;
  category: string;
  locale: string;
}

export async function indexProcedure(procedure: ProcedureVectorData): Promise<void> {
  const text = [procedure.name, procedure.description, procedure.category].join(' | ');

  await upsertVector({
    namespace: VECTOR_NAMESPACES.procedures,
    id: `procedure:${procedure.id}:${procedure.locale}`,
    text,
    metadata: {
      id: procedure.id,
      type: 'procedure',
      locale: procedure.locale,
      category: procedure.category,
    },
  });
}

export async function searchProcedures(
  query: string,
  options: {
    locale?: string;
    category?: string;
    topK?: number;
  } = {}
): Promise<QueryResult[]> {
  const { locale, category, topK = 10 } = options;

  const filter = buildFilterString({
    type: 'procedure',
    locale,
    category,
  });

  return queryVectors({
    namespace: VECTOR_NAMESPACES.procedures,
    query,
    topK,
    filter,
  });
}

// =====================================================
// BLOG POST VECTORS (CHUNKED)
// =====================================================

interface BlogChunk {
  postId: string;
  chunkIndex: number;
  content: string;
  title: string;
  locale: string;
}

export async function indexBlogPost(
  postId: string,
  title: string,
  content: string,
  locale: string,
  chunkSize: number = 500
): Promise<void> {
  // Split content into chunks
  const chunks = splitTextIntoChunks(content, chunkSize);

  const items = chunks.map((chunk, index) => ({
    id: `blog:${postId}:${locale}:chunk:${index}`,
    text: `${title} | ${chunk}`,
    metadata: {
      id: postId,
      type: 'blog-chunk',
      locale,
      chunkIndex: index,
      title,
    },
  }));

  await upsertVectors(VECTOR_NAMESPACES.blogPosts, items);
}

export async function searchBlogPosts(
  query: string,
  options: {
    locale?: string;
    topK?: number;
  } = {}
): Promise<QueryResult[]> {
  const { locale, topK = 10 } = options;

  const filter = buildFilterString({
    type: 'blog-chunk',
    locale,
  });

  return queryVectors({
    namespace: VECTOR_NAMESPACES.blogPosts,
    query,
    topK,
    filter,
  });
}

// =====================================================
// FAQ VECTORS
// =====================================================

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  locale: string;
}

export async function indexFAQ(faq: FAQItem): Promise<void> {
  const text = `${faq.question} | ${faq.answer}`;

  await upsertVector({
    namespace: VECTOR_NAMESPACES.faq,
    id: `faq:${faq.id}:${faq.locale}`,
    text,
    metadata: {
      id: faq.id,
      type: 'faq',
      locale: faq.locale,
      category: faq.category,
      question: faq.question,
    },
  });
}

export async function searchFAQ(
  query: string,
  options: {
    locale?: string;
    category?: string;
    topK?: number;
  } = {}
): Promise<QueryResult[]> {
  const { locale, category, topK = 5 } = options;

  const filter = buildFilterString({
    type: 'faq',
    locale,
    category,
  });

  return queryVectors({
    namespace: VECTOR_NAMESPACES.faq,
    query,
    topK,
    filter,
  });
}

// =====================================================
// RAG CONTEXT BUILDER
// =====================================================

interface RAGContext {
  hospitals: QueryResult[];
  procedures: QueryResult[];
  blogPosts: QueryResult[];
  faq: QueryResult[];
}

export async function buildRAGContext(
  query: string,
  locale: string
): Promise<RAGContext> {
  const [hospitals, procedures, blogPosts, faq] = await Promise.all([
    searchHospitals(query, { locale, topK: 3 }),
    searchProcedures(query, { locale, topK: 3 }),
    searchBlogPosts(query, { locale, topK: 3 }),
    searchFAQ(query, { locale, topK: 3 }),
  ]);

  return { hospitals, procedures, blogPosts, faq };
}

export function formatRAGContextForPrompt(context: RAGContext): string {
  const sections: string[] = [];

  if (context.hospitals.length > 0) {
    sections.push(
      '## Relevant Hospitals\n' +
        context.hospitals
          .map((h) => `- ${h.metadata?.text || h.id} (relevance: ${h.score.toFixed(2)})`)
          .join('\n')
    );
  }

  if (context.procedures.length > 0) {
    sections.push(
      '## Relevant Procedures\n' +
        context.procedures
          .map((p) => `- ${p.metadata?.text || p.id} (relevance: ${p.score.toFixed(2)})`)
          .join('\n')
    );
  }

  if (context.blogPosts.length > 0) {
    sections.push(
      '## Related Articles\n' +
        context.blogPosts
          .map((b) => `- ${b.metadata?.text || b.id} (relevance: ${b.score.toFixed(2)})`)
          .join('\n')
    );
  }

  if (context.faq.length > 0) {
    sections.push(
      '## FAQ\n' +
        context.faq
          .map(
            (f) =>
              `Q: ${f.metadata?.question || ''}\nA: ${f.metadata?.text || ''}`
          )
          .join('\n\n')
    );
  }

  return sections.join('\n\n');
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
