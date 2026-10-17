import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, 'dist');
const ssrBundlePath = path.resolve(__dirname, 'dist-ssr', 'entry-ssg.js');
const ssrBundleUrl = pathToFileURL(ssrBundlePath).href;

const {render, PRERENDER_PATHS} = await import(ssrBundleUrl);

const ROUTES =
  (PRERENDER_PATHS && Array.from(PRERENDER_PATHS)) ??
  ['/', '/server', '/moment', '/about', '/donate'];

const indexHtmlPath = path.join(distDir, 'index.html');
const template = await fs.readFile(indexHtmlPath, 'utf-8');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function injectMetadata(html, metadata) {
  const language = escapeHtml(metadata.language);
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  return html
    .replace(/<html\b[^>]*\blang="[^"]*"[^>]*>/i, `<html lang="${language}">`)
    .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/i, `<meta name="description" content="${description}" />`);
}

function injectIntoTemplate(appHtml, metadata) {
  const withMetadata = injectMetadata(template, metadata);
  const marker = '<div id="root"></div>';
  if (withMetadata.includes(marker)) {
    return withMetadata.replace(marker, `<div id="root">${appHtml}</div>`);
  }

  // Fallback: try to inject just before closing root div
  const altMarker = '<div id="root">';
  const idx = withMetadata.indexOf(altMarker);
  if (idx !== -1) {
    const insertPos = withMetadata.indexOf('</div>', idx);
    if (insertPos !== -1) {
      return (
        withMetadata.slice(0, insertPos) +
        appHtml +
        withMetadata.slice(insertPos)
      );
    }
  }

  console.warn(
    '[ssg] 未在模板中找到 <div id="root"></div> 占位符，将返回原始模板。',
  );
  return withMetadata;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, {recursive: true});
}

for (const url of ROUTES) {
  const {html, metadata} = await render(url);
  const finalHtml = injectIntoTemplate(html, metadata);

  const outPath =
    url === '/'
      ? path.join(distDir, 'index.html')
      : path.join(distDir, url.replace(/^\//, ''), 'index.html');

  await ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, finalHtml, 'utf-8');
  console.log('[ssg] generated', outPath);
}

console.log('[ssg] 完成预渲染路由:', ROUTES.join(', '));

