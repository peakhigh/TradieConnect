#!/usr/bin/env node
/**
 * Live docs server — reads .md files from /docs on each request.
 * No stale copies. Run: npm run docs
 *
 * Uses zero external dependencies (just Node built-ins).
 * Renders markdown to HTML client-side via marked.js CDN.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const DOCS_DIR = __dirname;

// Build sidebar entries from .md files (exclude README which becomes the landing)
function getDocList() {
  return fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort((a, b) => {
      // roadmap first, then alphabetical
      if (a === 'roadmap.md') return -1;
      if (b === 'roadmap.md') return 1;
      if (a === 'README.md') return -1;
      if (b === 'README.md') return 1;
      return a.localeCompare(b);
    })
    .map(f => ({
      file: f,
      slug: f.replace('.md', ''),
      label: f.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }));
}

function getMarkdownContent(slug) {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradieConnect Docs</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #1a1a2e; }
    .layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: 260px; background: #1a1a2e; color: #e0e0e0; padding: 24px 0;
      position: fixed; top: 0; left: 0; bottom: 0; overflow-y: auto;
    }
    .sidebar h1 { font-size: 18px; padding: 0 20px 16px; color: #fff; border-bottom: 1px solid #2a2a4a; margin-bottom: 12px; }
    .sidebar a {
      display: block; padding: 9px 20px; color: #b0b0c8; text-decoration: none;
      font-size: 13px; border-left: 3px solid transparent; transition: all 0.15s;
    }
    .sidebar a:hover { background: #2a2a4a; color: #fff; }
    .sidebar a.active { background: #2a2a4a; color: #6c9fff; border-left-color: #6c9fff; font-weight: 600; }
    .content { margin-left: 260px; flex: 1; padding: 40px 60px; max-width: 900px; }
    .content h1 { font-size: 28px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e0e4ea; }
    .content h2 { font-size: 22px; margin-top: 28px; margin-bottom: 10px; color: #1a1a2e; }
    .content h3 { font-size: 17px; margin-top: 20px; margin-bottom: 8px; color: #333; }
    .content p { line-height: 1.7; margin-bottom: 12px; color: #444; }
    .content ul, .content ol { margin: 8px 0 16px 24px; line-height: 1.8; }
    .content li { margin-bottom: 4px; color: #444; }
    .content code { background: #eef1f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'SF Mono', 'Fira Code', monospace; }
    .content pre { background: #1e1e2e; color: #cdd6f4; padding: 16px 20px; border-radius: 8px; overflow-x: auto; margin: 12px 0 20px; font-size: 13px; line-height: 1.5; }
    .content pre code { background: none; padding: 0; color: inherit; }
    .content table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 14px; }
    .content th { background: #eef1f6; text-align: left; padding: 10px 12px; font-weight: 600; border-bottom: 2px solid #d0d5dd; }
    .content td { padding: 8px 12px; border-bottom: 1px solid #e8ebf0; color: #444; }
    .content tr:hover td { background: #f8f9fb; }
    .content hr { border: none; border-top: 1px solid #e0e4ea; margin: 24px 0; }
    .content blockquote { border-left: 4px solid #6c9fff; padding: 8px 16px; margin: 12px 0; background: #f0f4ff; color: #555; }
    .content input[type="checkbox"] { margin-right: 6px; transform: scale(1.2); }
    @media (max-width: 768px) {
      .sidebar { width: 100%; position: relative; }
      .content { margin-left: 0; padding: 20px; }
      .layout { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <nav class="sidebar">
      <h1>🔧 TradieConnect</h1>
      {{SIDEBAR}}
    </nav>
    <main class="content" id="content"></main>
  </div>
  <script>
    const md = {{MARKDOWN_JSON}};
    document.getElementById('content').innerHTML = marked.parse(md, { gfm: true, breaks: true });
  <\/script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let slug = url.pathname.replace(/^\//, '') || 'roadmap';
  if (slug === 'favicon.ico') { res.writeHead(204); res.end(); return; }

  const docs = getDocList();
  const content = getMarkdownContent(slug);

  if (!content) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const sidebar = docs.map(d =>
    `<a href="/${d.slug}" class="${d.slug === slug ? 'active' : ''}">${d.label}</a>`
  ).join('\n      ');

  const html = HTML_TEMPLATE
    .replace('{{SIDEBAR}}', sidebar)
    .replace('{{MARKDOWN_JSON}}', JSON.stringify(content));

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`\n📖 TradieConnect Docs → http://localhost:${PORT}\n`);
  console.log(`   Reads .md files live from /docs — always up to date.\n`);
});
