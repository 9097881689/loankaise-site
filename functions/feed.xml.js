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
  const itemsXml = posts
    .slice(0, 30)
    .map((p) => {
      const link = `https://loankaise.in${p.url || '/news/' + p.slug + '/'}`;
      return `    <item>
      <title>${escXml(p.title)}</title>
      <link>${escXml(link)}</link>
      <guid isPermaLink="true">${escXml(link)}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <category>${escXml(p.categoryLabel || 'Finance')}</category>
      <description>${escXml(p.subtitle || p.title)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LoanKaise.in — Hindi Finance News &amp; Banking Guides</title>
    <link>https://loankaise.in/</link>
    <atom:link href="https://loankaise.in/feed.xml" rel="self" type="application/rss+xml" />
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub" />
    <description>ताज़ा फाइनेंस न्यूज़, लोन गाइड्स, RBI अपडेट्स और बैंकिंग टूल्स हिंदी में।</description>
    <language>hi-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=180',
    },
  });
}
