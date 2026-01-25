/**
 * Schema.org Structured Data Validation
 *
 * Validates and generates Schema.org structured data
 * for improved search engine understanding and rich snippets.
 */

// =====================================================
// TYPES
// =====================================================

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaError[];
  warnings: SchemaWarning[];
  schema: Record<string, unknown> | null;
}

export interface SchemaError {
  field: string;
  message: string;
  value?: unknown;
}

export interface SchemaWarning {
  field: string;
  message: string;
  recommendation: string;
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  content: string;
  author: string;
  publishedAt: string;
  modifiedAt?: string;
  imageUrl?: string;
  imageAlt?: string;
  url: string;
  locale: string;
  category?: string;
  tags?: string[];
  wordCount?: number;
}

export interface OrganizationSchemaInput {
  name: string;
  description: string;
  url: string;
  logo: string;
  email?: string;
  phone?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  socialProfiles?: string[];
}

export interface FAQSchemaInput {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export interface MedicalOrganizationSchemaInput extends OrganizationSchemaInput {
  medicalSpecialty?: string[];
  availableServices?: string[];
  priceRange?: string;
  openingHours?: string[];
  hasMap?: string;
  geo?: {
    latitude: number;
    longitude: number;
  };
}

export interface BreadcrumbSchemaInput {
  items: Array<{
    name: string;
    url: string;
  }>;
}

// =====================================================
// SCHEMA GENERATORS
// =====================================================

/**
 * Generate Article schema (for blog posts)
 */
export function generateArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    author: {
      '@type': 'Organization',
      name: input.author,
      url: 'https://getcarekorea.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'GetCareKorea',
      logo: {
        '@type': 'ImageObject',
        url: 'https://getcarekorea.com/logo.png',
      },
    },
    datePublished: input.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.url,
    },
    inLanguage: input.locale,
  };

  // Optional fields
  if (input.modifiedAt) {
    schema.dateModified = input.modifiedAt;
  }

  if (input.imageUrl) {
    schema.image = {
      '@type': 'ImageObject',
      url: input.imageUrl,
      caption: input.imageAlt || input.title,
    };
  }

  if (input.wordCount) {
    schema.wordCount = input.wordCount;
  }

  if (input.category) {
    schema.articleSection = input.category;
  }

  if (input.tags && input.tags.length > 0) {
    schema.keywords = input.tags.join(', ');
  }

  return schema;
}

/**
 * Generate MedicalWebPage schema (for medical content)
 */
export function generateMedicalWebPageSchema(input: ArticleSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: input.title,
    description: input.description,
    url: input.url,
    inLanguage: input.locale,
    datePublished: input.publishedAt,
    dateModified: input.modifiedAt || input.publishedAt,
    mainContentOfPage: {
      '@type': 'WebPageElement',
      cssSelector: '.article-content',
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-title', '.article-excerpt'],
    },
    specialty: input.category ? mapCategoryToMedicalSpecialty(input.category) : undefined,
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(input: OrganizationSchemaInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    description: input.description,
    url: input.url,
    logo: input.logo,
  };

  if (input.email) {
    schema.email = input.email;
  }

  if (input.phone) {
    schema.telephone = input.phone;
  }

  if (input.address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...input.address,
    };
  }

  if (input.socialProfiles && input.socialProfiles.length > 0) {
    schema.sameAs = input.socialProfiles;
  }

  return schema;
}

/**
 * Generate MedicalOrganization schema (for hospitals/clinics)
 */
export function generateMedicalOrganizationSchema(
  input: MedicalOrganizationSchemaInput
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: input.name,
    description: input.description,
    url: input.url,
    logo: input.logo,
  };

  if (input.email) schema.email = input.email;
  if (input.phone) schema.telephone = input.phone;

  if (input.address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...input.address,
    };
  }

  if (input.medicalSpecialty && input.medicalSpecialty.length > 0) {
    schema.medicalSpecialty = input.medicalSpecialty;
  }

  if (input.availableServices && input.availableServices.length > 0) {
    schema.availableService = input.availableServices.map(service => ({
      '@type': 'MedicalProcedure',
      name: service,
    }));
  }

  if (input.priceRange) {
    schema.priceRange = input.priceRange;
  }

  if (input.openingHours && input.openingHours.length > 0) {
    schema.openingHoursSpecification = input.openingHours;
  }

  if (input.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
    };
  }

  if (input.hasMap) {
    schema.hasMap = input.hasMap;
  }

  return schema;
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(input: FAQSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: input.questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(input: BreadcrumbSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate HowTo schema (for procedure guides)
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string; image?: string }>,
  totalTime?: string,
  estimatedCost?: { currency: string; value: string }
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };

  if (totalTime) {
    schema.totalTime = totalTime;
  }

  if (estimatedCost) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: estimatedCost.currency,
      value: estimatedCost.value,
    };
  }

  return schema;
}

// =====================================================
// VALIDATION
// =====================================================

/**
 * Validate Article schema
 */
export function validateArticleSchema(schema: Record<string, unknown>): SchemaValidationResult {
  const errors: SchemaError[] = [];
  const warnings: SchemaWarning[] = [];

  // Required fields
  const requiredFields = ['@context', '@type', 'headline', 'author', 'datePublished'];

  for (const field of requiredFields) {
    if (!schema[field]) {
      errors.push({
        field,
        message: `Required field "${field}" is missing`,
      });
    }
  }

  // Validate @context
  if (schema['@context'] !== 'https://schema.org') {
    errors.push({
      field: '@context',
      message: '@context must be "https://schema.org"',
      value: schema['@context'],
    });
  }

  // Validate @type
  if (schema['@type'] !== 'Article' && schema['@type'] !== 'MedicalWebPage') {
    errors.push({
      field: '@type',
      message: '@type must be "Article" or "MedicalWebPage"',
      value: schema['@type'],
    });
  }

  // Validate headline length
  const headline = schema.headline as string;
  if (headline) {
    if (headline.length > 110) {
      warnings.push({
        field: 'headline',
        message: 'Headline exceeds recommended length (110 characters)',
        recommendation: 'Shorten the headline for better display in search results',
      });
    }
  }

  // Validate datePublished format
  const datePublished = schema.datePublished as string;
  if (datePublished && !isValidISO8601(datePublished)) {
    errors.push({
      field: 'datePublished',
      message: 'datePublished must be a valid ISO 8601 date',
      value: datePublished,
    });
  }

  // Validate image
  if (!schema.image) {
    warnings.push({
      field: 'image',
      message: 'No image specified',
      recommendation: 'Add an image for better rich snippet display',
    });
  }

  // Validate description
  const description = schema.description as string;
  if (description) {
    if (description.length < 50) {
      warnings.push({
        field: 'description',
        message: 'Description is too short',
        recommendation: 'Use at least 50 characters for the description',
      });
    } else if (description.length > 320) {
      warnings.push({
        field: 'description',
        message: 'Description is too long',
        recommendation: 'Keep description under 320 characters',
      });
    }
  } else {
    warnings.push({
      field: 'description',
      message: 'No description specified',
      recommendation: 'Add a description for better SEO',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    schema: errors.length === 0 ? schema : null,
  };
}

/**
 * Validate FAQ schema
 */
export function validateFAQSchema(schema: Record<string, unknown>): SchemaValidationResult {
  const errors: SchemaError[] = [];
  const warnings: SchemaWarning[] = [];

  // Required fields
  if (schema['@type'] !== 'FAQPage') {
    errors.push({
      field: '@type',
      message: '@type must be "FAQPage"',
      value: schema['@type'],
    });
  }

  const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
  if (!mainEntity || mainEntity.length === 0) {
    errors.push({
      field: 'mainEntity',
      message: 'At least one question is required',
    });
  } else {
    // Validate each question
    mainEntity.forEach((question, index) => {
      if (question['@type'] !== 'Question') {
        errors.push({
          field: `mainEntity[${index}].@type`,
          message: 'Question @type must be "Question"',
        });
      }

      if (!question.name) {
        errors.push({
          field: `mainEntity[${index}].name`,
          message: 'Question name is required',
        });
      }

      const answer = question.acceptedAnswer as Record<string, unknown>;
      if (!answer || !answer.text) {
        errors.push({
          field: `mainEntity[${index}].acceptedAnswer`,
          message: 'Answer text is required',
        });
      }
    });

    // Warnings
    if (mainEntity.length < 3) {
      warnings.push({
        field: 'mainEntity',
        message: 'Few questions in FAQ',
        recommendation: 'Consider adding more questions for better coverage',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    schema: errors.length === 0 ? schema : null,
  };
}

/**
 * Validate any schema against basic requirements
 */
export function validateSchema(schema: Record<string, unknown>): SchemaValidationResult {
  const errors: SchemaError[] = [];
  const warnings: SchemaWarning[] = [];

  // Check @context
  if (!schema['@context']) {
    errors.push({
      field: '@context',
      message: '@context is required',
    });
  }

  // Check @type
  if (!schema['@type']) {
    errors.push({
      field: '@type',
      message: '@type is required',
    });
  }

  // Type-specific validation
  const schemaType = schema['@type'];

  switch (schemaType) {
    case 'Article':
    case 'MedicalWebPage':
      return validateArticleSchema(schema);
    case 'FAQPage':
      return validateFAQSchema(schema);
    default:
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        schema: errors.length === 0 ? schema : null,
      };
  }
}

// =====================================================
// HELPERS
// =====================================================

function isValidISO8601(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function mapCategoryToMedicalSpecialty(category: string): string | undefined {
  const mapping: Record<string, string> = {
    'plastic-surgery': 'Plastic Surgery',
    'dermatology': 'Dermatology',
    'dental': 'Dentistry',
    'health-checkup': 'Diagnostic Medicine',
    'medical-tourism': 'Medical Tourism',
  };

  return mapping[category];
}

/**
 * Generate combined schema for a blog post page
 */
export function generateBlogPostSchemas(
  article: ArticleSchemaInput,
  faq?: FAQSchemaInput,
  breadcrumb?: BreadcrumbSchemaInput
): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];

  // Article schema
  schemas.push(generateArticleSchema(article));

  // Medical web page schema (for medical content)
  if (article.category && ['plastic-surgery', 'dermatology', 'dental', 'health-checkup'].includes(article.category)) {
    schemas.push(generateMedicalWebPageSchema(article));
  }

  // FAQ schema
  if (faq && faq.questions.length > 0) {
    schemas.push(generateFAQSchema(faq));
  }

  // Breadcrumb schema
  if (breadcrumb && breadcrumb.items.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumb));
  }

  return schemas;
}

/**
 * Render schema as JSON-LD script tag content
 */
export function renderSchemaAsJsonLd(schemas: Record<string, unknown>[]): string {
  if (schemas.length === 1) {
    return JSON.stringify(schemas[0]);
  }

  return JSON.stringify(schemas);
}
