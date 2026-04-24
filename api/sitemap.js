import { readFileSync } from 'fs';
import { join } from 'path';

function toSlug(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function handler(req, res) {
  const origin = `https://${req.headers.host}`;
  const today = new Date().toISOString().split('T')[0];

  let prompts = [];
  try {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const match = html.match(/const PUBLISHED = (\[[\s\S]*?\]);/);
    if (match) prompts = JSON.parse(match[1]);
  } catch (e) {}

  const urls = [
    `  <url>
    <loc>${origin}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>`,
    ...prompts.map(p => `  <url>
    <loc>${origin}/prompt/${toSlug(p.title)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <lastmod>${today}</lastmod>
  </url>`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
}
