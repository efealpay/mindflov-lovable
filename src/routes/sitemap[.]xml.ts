import { createFileRoute } from '@tanstack/react-router';

const PATHS = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/how-it-works', priority: '0.9', changefreq: 'monthly' },
  { path: '/generation-modes', priority: '0.9', changefreq: 'monthly' },
  { path: '/contexts', priority: '0.9', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.9', changefreq: 'monthly' },
  { path: '/for/content-creators', priority: '0.8', changefreq: 'monthly' },
  { path: '/for/marketers', priority: '0.8', changefreq: 'monthly' },
  { path: '/for/designers', priority: '0.8', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'yearly' },
  { path: '/faq', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
];

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const today = new Date().toISOString().slice(0, 10);
        const urls = PATHS.map(
          (entry) =>
            `  <url>\n    <loc>${origin}${entry.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`,
        ).join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      },
    },
  },
});
