import { loadAllPosts } from './lib/store.js';

function escXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function onRequestGet({ request, env }) {
  const posts = await loadAllPosts(request, env);
  const newsPosts = posts.filter((p) => !p.isLegacyGuide).slice(0, 50);

  const itemsXml = newsPosts
    .map(
      (p) => `  <url>
    <loc>https://loankaise.in/news/${escXml(p.slug)}/</loc>
    <news:news>
      <news:publication>
        <news:name>LoanKaise.in</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.publishedAt).toISOString()}</news:publication_date>
      <news:title>${escXml(p.title)}</news:title>
    </news:news>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${itemsXml}
</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=180',
    },
  });
}
