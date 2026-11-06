// Checks the built site after scripts/seo-build.mjs; fails the build on
// mistakes that would hurt indexing. Run: node scripts/seo-check.mjs
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist/frontend/browser';
const site = JSON.parse(await readFile('src/app/core/seo/site.json', 'utf8'));
const SITE = site.siteUrl.replace(/\/$/, '');
const errors = [];
const fail = (msg) => errors.push(msg);
const exists = (p) => stat(p).then(() => true, () => false);

const attr = (html, re) => html.match(re)?.[1];
const head = (html) => ({
  title: attr(html, /<title>([^<]*)<\/title>/),
  description: attr(html, /<meta name="?description"? content="([^"]*)"/),
  robots: attr(html, /<meta name="?robots"? content="([^"]*)"/),
  canonical: attr(html, /<link rel="?canonical"? href="([^"]*)"/),
  ogImage: attr(html, /<meta property="?og:image"? content="([^"]*)"/),
  jsonLd: [...html.matchAll(/<script type="?application\/ld\+json"?[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])
});
// Render serves dir/index.html only at "/dir/", so sitemap URLs end in a slash
const fileFor = (url) => join(DIST, url.slice(SITE.length), 'index.html');

// robots.txt
const robots = await readFile(join(DIST, 'robots.txt'), 'utf8').catch(() => fail('robots.txt missing') || '');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail('robots.txt does not point to the sitemap');
const disallowed = [...robots.matchAll(/^Disallow:\s*(\S+)/gm)].map(m => m[1]);
for (const rule of disallowed) {
  if (rule === '/' || /^\/(assets|icons|[^/]*\.(js|css))/.test(rule)) fail(`robots.txt blocks resources needed to render: ${rule}`);
}
const blocked = (path) => disallowed.some(rule => new RegExp('^' + rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')).test(path));

// sitemap.xml
const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8').catch(() => fail('sitemap.xml missing') || '');
if (!/^<\?xml[^>]*\?>\s*<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">[\s\S]*<\/urlset>\s*$/.test(sitemap)) fail('sitemap.xml is not a valid urlset');
const urls = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
if (!urls.length) fail('sitemap.xml has no URLs');
if (new Set(urls).size !== urls.length) fail('sitemap.xml has duplicate URLs');
for (const m of sitemap.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) {
  if (isNaN(Date.parse(m[1]))) fail(`sitemap.xml has an invalid lastmod: ${m[1]}`);
}

const titles = new Map();
const descriptions = new Map();
for (const url of urls) {
  if (!url.startsWith(SITE + '/')) { fail(`sitemap URL on another host: ${url}`); continue; }
  if (/[?#]/.test(url) || !url.endsWith('/')) fail(`sitemap URL is not canonical (needs a trailing slash): ${url}`);
  const path = url.slice(SITE.length);
  if (blocked(path)) fail(`sitemap URL is blocked by robots.txt: ${url}`);
  const file = fileFor(url);
  if (!(await exists(file))) { fail(`sitemap URL has no page: ${url}`); continue; }
  const tags = head(await readFile(file, 'utf8'));
  if (!tags.title) fail(`${path}: no title`);
  if (!tags.description) fail(`${path}: no meta description`);
  if (tags.robots?.includes('noindex')) fail(`${path}: in the sitemap but noindex`);
  // "/" is the shared app shell; the app sets its canonical in the browser
  if (path !== '/' && tags.canonical !== url) fail(`${path}: canonical is ${tags.canonical}, expected ${url}`);
  if (tags.ogImage && !/^https:\/\//.test(tags.ogImage)) fail(`${path}: og:image is not an absolute https URL`);
  for (const block of tags.jsonLd) {
    try {
      const data = JSON.parse(block);
      if (data['@context'] !== 'https://schema.org') fail(`${path}: JSON-LD without the schema.org context`);
    } catch {
      fail(`${path}: JSON-LD does not parse`);
    }
  }
  if (titles.has(tags.title)) fail(`duplicate title on ${path} and ${titles.get(tags.title)}`);
  if (descriptions.has(tags.description)) fail(`duplicate description on ${path} and ${descriptions.get(tags.description)}`);
  titles.set(tags.title, path);
  descriptions.set(tags.description, path);
}

// Pages marked noindex must not be in the sitemap
for (const page of site.pages.filter(p => p.noindex)) {
  if (urls.includes(SITE + page.path + '/') || urls.includes(SITE + page.path)) fail(`${page.path} is noindex but listed in the sitemap`);
}

// No development hosts anywhere in what we publish
const leaks = /localhost|127\.0\.0\.1|onrender\.com\/(?!api)/;
const scan = async (dir) => {
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    if ((await stat(full)).isDirectory()) { if (name !== 'assets') await scan(full); continue; }
    if (/\.(html|xml|txt)$/.test(name) && leaks.test(await readFile(full, 'utf8'))) fail(`${full} mentions a development host`);
  }
};
await scan(DIST);

// Every image in the source has alt text (alt="" for decorative ones)
const sources = async (dir, out = []) => {
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    if ((await stat(full)).isDirectory()) await sources(full, out);
    else if (/\.(ts|html)$/.test(name)) out.push(full);
  }
  return out;
};
for (const file of await sources('src/app')) {
  for (const m of (await readFile(file, 'utf8')).matchAll(/<img\b[^>]*>/g)) {
    if (!/\s(\[alt\]|\[attr\.alt\]|alt)=/.test(m[0])) fail(`${file}: <img> without alt`);
  }
}

if (errors.length) {
  console.error(`[seo-check] ${errors.length} problem(s):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`[seo-check] OK: ${urls.length} sitemap URLs checked, robots.txt and metadata valid`);
