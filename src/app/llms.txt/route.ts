import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://getcarekorea.com';

  const content = `# GetCareKorea - Medical Tourism Platform
# https://getcarekorea.com

> GetCareKorea connects international patients with top Korean hospitals and certified medical interpreters for premium healthcare experiences.

## Allowed Sections
- /blog - Medical tourism articles and guides
- /hospitals - Korean hospital directory
- /interpreters - Medical interpreter profiles
- /procedures - Medical procedure information
- /faq - Frequently asked questions

## Disallowed Sections
- /admin - Administrative dashboard (private)
- /api - API endpoints (private)
- /auth - Authentication pages (private)

## Contact
- Website: ${baseUrl}
- Email: support@getcarekorea.com

## Sitemap
${baseUrl}/sitemap.xml
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
