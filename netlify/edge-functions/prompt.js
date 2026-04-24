function toSlug(title) {
  return title
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

export default async (request, context) => {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/prompt\//, '').replace(/\/$/, '');
  if (!slug) return context.next();

  try {
    const html = await fetch(new URL('/', url.origin)).then(r => r.text());
    const match = html.match(/const PUBLISHED = (\[[\s\S]*?\]);/);
    if (!match) return context.next();

    const prompts = JSON.parse(match[1]);
    const prompt = prompts.find(p => toSlug(p.title) === slug);
    if (!prompt) return context.next();

    const promptUrl = `${url.origin}/prompt/${slug}`;
    const img = prompt.img || `${url.origin}/og-default.jpg`;
    const desc = esc(prompt.desc || `Prompt de ${prompt.tool} · ${prompt.cat}`);
    const title = esc(`${prompt.title} · Prompts de @german.dsg`);

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
    return new Response(modified, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  } catch (e) {
    return context.next();
  }
};

export const config = { path: '/prompt/*' };
