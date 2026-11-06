// Runs after `ng build`. The app renders in the browser, but link previews
// (WhatsApp, Facebook, LinkedIn, X) and some crawlers never run JavaScript,
// so every public page gets its own HTML file with the right title,
// description, canonical URL, social tags and structured data. Render serves
// a real file before its "/* -> /index.html" rewrite, and the app then boots
// exactly as before. Also writes sitemap.xml, robots.txt and the IndexNow key.
//
// Env: SEO_SKIP_API=1 builds the static pages only (offline builds);
//      SEO_API_URL reads listings from another API (local testing);
//      INDEXNOW_KEY writes /<key>.txt for IndexNow.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const DIST = 'dist/frontend/browser';
const site = JSON.parse(await readFile('src/app/core/seo/site.json', 'utf8'));
const SITE = site.siteUrl.replace(/\/$/, '');
const API = process.env.SEO_API_URL || (await readFile('src/environments/environment.prod.ts', 'utf8')).match(/apiUrl:\s*'([^']+)'/)[1];

// Same wording as the app (shared/components/listing-cards/listing-format.ts)
const CATEGORY = {
  food: 'Food & cakes', decor: 'Decoration', photography: 'Photography', music: 'Music & DJ',
  cleanup: 'Cleanup', entertainment: 'Entertainment', venue: 'Venue', other: 'Other services'
};
const EVENT_TYPE = {
  birthday: 'Birthday', house_party: 'House party', meetup: 'Meetup', wedding: 'Wedding',
  corporate: 'Corporate', farewell: 'Farewell', other: 'Event'
};
const PRICE_UNIT = { per_event: 'per event', per_hour: 'per hour', per_day: 'per day', per_person: 'per guest' };

const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const absolute = (url) => (/^https?:\/\//.test(url) ? url : SITE + url);
// Render serves dir/index.html only at "/dir/" ("/dir" falls through to the
// app shell), so the crawlable, canonical form of every page ends in a slash
const pageUrl = (path) => SITE + (path.endsWith('/') ? path : path + '/');
const jsonLd = (data) => `<script type="application/ld+json" data-seo="page">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

// Same as snippet() in core/services/seo.service.ts
const snippet = (text, max = 155) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(' ', max - 1)).replace(/[,.;:\s]+$/, '') + '…';
};

// "2026-11-20" in India, whatever the stored time of day
const istDate = (date) => new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const istLabel = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

const breadcrumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: pageUrl(path) }))
});

async function fetchPages() {
  if (process.env.SEO_SKIP_API) return { services: [], events: [] };
  // The API may be waking up from sleep on the free plan
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${API}/seo/pages`, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()).data;
    } catch (error) {
      console.warn(`[seo] listings attempt ${attempt} failed: ${error.message}`);
    }
  }
  console.warn('[seo] WARNING: building without vendor and event pages; they still work, but without their own previews until the next build');
  return { services: [], events: [] };
}

function servicePage(s) {
  const path = `/services/${s.slug}`;
  const category = CATEGORY[s.category] || 'Service';
  const image = s.image ? absolute(s.image) : null;
  return {
    path,
    title: `${s.name} · ${category} in ${s.city} · ${site.siteName}`,
    description: snippet(s.description),
    image,
    lastmod: s.updatedAt,
    schema: [
      {
        '@type': 'Service',
        name: s.name,
        description: s.description,
        serviceType: category,
        url: pageUrl(path),
        ...(image && { image }),
        areaServed: [...new Set([s.city, ...s.areas])].map(name => ({ '@type': 'City', name })),
        provider: {
          '@type': 'LocalBusiness',
          name: s.provider || s.name,
          address: { '@type': 'PostalAddress', addressLocality: s.city, addressCountry: 'IN' }
        },
        offers: {
          '@type': 'Offer',
          url: pageUrl(path),
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: s.price,
            priceCurrency: 'INR',
            ...(PRICE_UNIT[s.priceUnit] && { unitText: PRICE_UNIT[s.priceUnit] })
          }
        },
        // Only real reviews from completed bookings
        ...(s.rating && {
          aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(s.rating.average.toFixed(1)), reviewCount: s.rating.count, bestRating: 5, worstRating: 1 }
        })
      },
      breadcrumbs([['Home', '/'], ['Vendors', '/services'], [s.name, path]])
    ]
  };
}

function eventPage(e) {
  const path = `/events/${e.slug}`;
  const when = istLabel(e.date);
  const day = istDate(e.date);
  const startDate = e.time && /^\d{2}:\d{2}$/.test(e.time) ? `${day}T${e.time}:00+05:30` : day;
  const image = e.image ? absolute(e.image) : null;
  return {
    path,
    title: `${e.title} · ${when}, ${e.city} · ${site.siteName}`,
    description: snippet(`${EVENT_TYPE[e.eventType] || 'Event'} on ${when} in ${e.city}. ${e.description || ''}`),
    image,
    lastmod: e.updatedAt,
    schema: [
      {
        '@type': 'Event',
        name: e.title,
        description: e.description,
        startDate,
        ...(e.endDate && { endDate: istDate(e.endDate) }),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        url: pageUrl(path),
        ...(image && { image: [image] }),
        location: {
          '@type': 'Place',
          name: e.venue,
          address: { '@type': 'PostalAddress', streetAddress: e.address, addressLocality: e.city, addressCountry: 'IN' }
        },
        ...(e.organizer && { organizer: { '@type': 'Person', name: e.organizer } }),
        offers: { '@type': 'Offer', url: pageUrl(path), price: e.price, priceCurrency: 'INR' }
      },
      breadcrumbs([['Home', '/'], ['Events', '/events'], [e.title, path]])
    ]
  };
}

// Swap the default tags from src/index.html for the page's own
function render(template, page) {
  const url = pageUrl(page.path);
  const image = absolute(page.image || site.defaultImage);
  const robots = page.noindex ? 'noindex' : 'index, follow, max-image-preview:large';
  const tags = [
    `<title>${escape(page.title)}</title>`,
    `<meta name="description" content="${escape(page.description)}">`,
    `<meta name="robots" content="${robots}">`,
    page.noindex ? '' : `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escape(site.siteName)}">`,
    `<meta property="og:locale" content="${site.locale}">`,
    `<meta property="og:title" content="${escape(page.title)}">`,
    `<meta property="og:description" content="${escape(page.description)}">`,
    page.noindex ? '' : `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${escape(image)}">`,
    ...(page.image ? [] : ['<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">']),
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escape(page.title)}">`,
    `<meta name="twitter:description" content="${escape(page.description)}">`,
    `<meta name="twitter:image" content="${escape(image)}">`,
    page.schema ? jsonLd({ '@context': 'https://schema.org', '@graph': page.schema }) : ''
  ].filter(Boolean).join('\n  ');

  const html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="?(description|robots)"?[^>]*>\s*/g, '')
    .replace(/<meta property="?og:[^>]*>\s*/g, '')
    .replace(/<meta name="?twitter:[^>]*>\s*/g, '')
    .replace(/<link rel="?canonical"?[^>]*>\s*/g, '');
  // Early in <head>, before the inlined CSS: some link-preview bots read only the start
  const viewport = html.match(/<meta name="?viewport"?[^>]*>/);
  if (!viewport) throw new Error('index.html has no viewport meta tag');
  return html.replace(viewport[0], `${viewport[0]}\n  ${tags}`);
}

const write = async (file, content) => {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
};

const template = await readFile(join(DIST, 'index.html'), 'utf8');
const { services, events } = await fetchPages();

const pages = [
  // "/" is index.html itself; the service worker checks its hash, so it is not rewritten
  ...site.pages.filter(p => p.path !== '/'),
  ...services.map(servicePage),
  ...events.map(eventPage)
];

for (const page of pages) {
  await write(join(DIST, page.path, 'index.html'), render(template, page));
}

const indexable = [site.pages.find(p => p.path === '/'), ...pages].filter(p => !p.noindex);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...indexable.map(p => `  <url><loc>${escape(pageUrl(p.path))}</loc>${p.lastmod ? `<lastmod>${new Date(p.lastmod).toISOString()}</lastmod>` : ''}</url>`),
  '</urlset>',
  ''
].join('\n');
await write(join(DIST, 'sitemap.xml'), sitemap);

// Private pages need a login anyway; this only saves crawl budget.
// noindex (set by the app) is what keeps them out of results.
const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /dashboard',
  'Disallow: /bookings',
  'Disallow: /messages',
  'Disallow: /notifications',
  'Disallow: /profile',
  'Disallow: /admin',
  'Disallow: /auth/',
  'Disallow: /events/create',
  'Disallow: /events/*/edit',
  'Disallow: /services/create',
  'Disallow: /services/edit/',
  '',
  `Sitemap: ${SITE}/sitemap.xml`,
  ''
].join('\n');
await write(join(DIST, 'robots.txt'), robots);

const key = process.env.INDEXNOW_KEY;
if (key) {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('INDEXNOW_KEY must be 8-128 letters, digits or dashes');
  await write(join(DIST, `${key}.txt`), key);
}

console.log(`[seo] ${pages.length} pages pre-rendered (${services.length} vendors, ${events.length} events), ${indexable.length} URLs in sitemap.xml${key ? ', IndexNow key file written' : ''}`);
