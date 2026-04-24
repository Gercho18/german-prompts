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

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function handler(req, res) {
  const { slug } = req.query;
  if (!slug) { res.redirect(302, '/'); return; }

  try {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const match = html.match(/const PUBLISHED = (\[[\s\S]*?\]);/);
    if (!match) { res.redirect(302, '/'); return; }

    const prompts = JSON.parse(match[1]);
    const prompt = prompts.find(p => toSlug(p.title) === slug);
    if (!prompt) { res.redirect(302, '/'); return; }

    const origin = `https://${req.headers.host}`;
    const promptUrl = `${origin}/prompt/${slug}`;
    const img = prompt.img || `${origin}/og-image.svg`;
    const title = esc(`${prompt.title} · Prompts de @german.dsg`);
    const desc = esc(prompt.desc || `Prompt de ${prompt.tool} · ${prompt.cat}`);

    const meta = `
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${img}">
  <meta property="og:url" content="${promptUrl}">
  <meta property="og:site_name" content="Prompts de @german.dsg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${img}">`;

    const modified = html.replace('</head>', meta + '\n</head>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(modified);
  } catch (e) {
    res.redirect(302, '/');
  }
}
