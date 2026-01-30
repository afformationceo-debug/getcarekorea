import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // IMPORTANT: Always use production URL for robots.txt
  const baseUrl = 'https://getcarekorea.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
