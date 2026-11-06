# SEO implementation report

_Festivo (festivo.paathly.in). Done on 6 November 2026. Nothing is live until both repos are pushed and Render redeploys._

## 1. Initial audit

| Area | What was there |
|---|---|
| Frontend | Angular 18 (standalone components, signals, esbuild application builder), installable PWA with Angular service worker |
| Backend | Express + Mongoose on Render (`festivo-be.onrender.com`, free plan, sleeps when idle) |
| Rendering | **Client-side only.** One `index.html` for every URL; Render rewrites `/*` to `/index.html`. No SSR or prerendering. |
| Hosting | Render static site, `staticPublishPath: dist/frontend/browser`, auto-deploys from `main` |
| Production domain | `https://festivo.paathly.in` (no www) |
| Metadata | One fixed title, description and Open Graph block in `index.html` for every page; **no** per-page titles, no canonical tags, no robots meta, no Twitter title or description |
| Sitemap | **None** |
| robots.txt | Static file blocking the private areas; **no `Sitemap:` line** |
| Structured data | **None** |
| Images | All `<img>` tags had alt text; list cards already lazy-loaded; fonts and critical CSS inlined by the Angular build |
| Social previews | Every shared link (a vendor's page on WhatsApp, an event invite) showed the same generic Festivo card |

**Public pages that should be indexed:**
- `/`, `/services` (vendor list), `/events` (public events), `/for-vendors`;
- `/terms`, `/privacy`, `/refund-policy`, `/contact`;
- every active vendor page `/services/:slug`;
- every upcoming public event `/events/:slug`.

**Pages that must stay out:**
- `/auth/*`, `/dashboard/*`, `/bookings`, `/messages`, `/notifications`, `/profile`, `/admin`;
- the create and edit forms;
- `/delete-account` (needed for Google Play, not for search);
- **invite-only (private) events**: they can be opened by link but must never be indexed or listed.

## 2. Issues found

1. **No per-page metadata.** Google saw one title and description for the whole site; WhatsApp, Facebook, LinkedIn and X previews were identical for every link.
2. **No sitemap** and no `Sitemap:` in robots.txt, so vendor and event pages could only be found by following links.
3. **No canonical URLs.** `?category=…`, `?invite=…` and `/page/` vs `/page` variants could compete with each other, as could the Render default host.
4. **The SPA served "page not found" with HTTP 200 and no noindex** (a "soft 404").
5. **Private event pages were not marked noindex.**
6. **The description promised payment protection** ("Payments are held safely until the job is done") while online payments are switched off in production. I replaced it with an accurate one.
7. **Viewing a vendor page saved the whole document** (`service.save()`), changing its `updatedAt` on every view. That made "last modified" meaningless for a sitemap. Event views had the same effect through `updateOne`.
8. **No structured data.**

## 3. What was implemented

### How crawlers now get real metadata on a client-rendered app
Full Angular SSR would mean running the app on a Node server instead of a static site, and auditing every browser-only API (localStorage, window, sockets) for hydration. That is high risk for this codebase. Instead:

- **Build-time head pre-rendering** (`frontend/scripts/seo-build.mjs`, runs after `ng build`):
  - For every public page, it writes `dist/…/<path>/index.html`: a copy of the built `index.html` with that page's own title, description, robots, canonical, Open Graph, Twitter and JSON-LD tags.
  - Render serves a real file before applying its `/* → /index.html` rewrite (confirmed in [Render's docs](https://render.com/docs/redirects-rewrites)), so crawlers and link-preview bots get the right tags without running JavaScript.
  - The app then boots exactly as before; no hydration, no server.
  - Vendor and event pages come from a new public API endpoint at build time.
- **Keeping it fresh:**
  - An hourly backend job triggers a frontend rebuild (Render deploy hook) when a listing was created, edited or taken down. It allows at most one rebuild every 6 hours.
  - About 20 minutes later, once the new pages are live, it sends the changed URLs to IndexNow.
  - A listing created between rebuilds still works and is still indexable by Google; it just shows the generic preview card until the next build.
- **In the browser** (`SeoService`), every navigation sets:
  - the title, description, robots, canonical and Open Graph/Twitter tags;
  - **noindex** on private, unknown and not-found pages, and on private events, even for their organizer.

  Google renders JavaScript, so this covers pages built after the last rebuild and in-app navigation.
- `index.html` is deliberately left **without** a canonical tag. Render serves it for every unknown URL, and a home-page canonical there would mislabel new listings.
  - This is also why `/` itself is not rewritten at build time: the service worker verifies `index.html` by hash.
  - The home page's canonical is set in the browser.

### Other fixes
- The view counters use `$inc` with `timestamps: false`, so `updatedAt` now means "the listing changed" and sitemap `lastmod` dates are accurate.
- Gallery thumbnails on vendor pages have descriptive alt text and lazy loading.
- An accurate site description replaced the one about held payments.

## 4. Files created or modified

**Frontend (`frontend/`)**

| File | Change |
|---|---|
| `src/app/core/seo/site.json` | **New.** Single source for the site URL, name and every static page's title and description (read by both the app and the build scripts) |
| `src/app/core/services/seo.service.ts` | **New.** Per-route title, description, robots, canonical, OG and Twitter; `serviceSeo()`, `eventSeo()`, `notFound()` |
| `scripts/seo-build.mjs` | **New.** Pre-renders page heads; writes `sitemap.xml`, `robots.txt` and the IndexNow key file |
| `scripts/seo-check.mjs` | **New.** Validation that fails the build on SEO mistakes (section 10) |
| `src/index.html` | Accurate default description; `og:locale`, Twitter title, description and image, `og:image:alt`; site-wide Organization and WebSite JSON-LD; no canonical (see above) |
| `src/app/app.component.ts` | Starts `SeoService` |
| `src/app/features/services/pages/service-detail/service-detail.component.ts` | Sets vendor-page tags after load, noindex if not found; alt text and lazy loading on thumbnails |
| `src/app/features/events/pages/event-detail/event-detail.component.ts` | Sets event-page tags after load; noindex for private or not-found events |
| `src/app/features/not-found/not-found.component.ts` | "Page not found" title + noindex |
| `package.json` | `build` = `ng build` → `seo-build` → `seo-check`; new `seo:check` script |
| `tsconfig.json` | `resolveJsonModule` (to import `site.json`) |
| `src/app/app.component.ts` (styles) | Content area reserves a full screen; removes the footer layout shift |
| `src/app/core/services/payment.service.ts` | Remembers the last payments config on the device (`lastConfig()`) |
| `src/app/features/for-vendors/for-vendors.component.ts` | Launch note renders at first paint (no layout shift) |
| `public/robots.txt` | **Removed.** It is now generated, so it always points to the right sitemap |
| `render.yaml` | Documents the optional `INDEXNOW_KEY` |

**Backend (`backend/`)**

| File | Change |
|---|---|
| `src/services/seoService.js` | **New.** `publicPages()` (active vendors, upcoming public events; never private), `changedPaths()`, `notifyIndexNow()`, `refreshSearchPages()` |
| `src/controllers/seoController.js`, `src/routes/seoRoutes.js` | **New.** `GET /api/v1/seo/pages` (public, cached 5 minutes) |
| `src/jobs/searchPages.js` | **New.** Hourly job: rebuild and IndexNow |
| `src/models/SiteState.js` | **New.** Remembers the last rebuild and pending URLs across restarts |
| `server.js`, `src/routes/index.js`, `src/models/index.js` | Wiring |
| `src/controllers/serviceController.js`, `src/controllers/eventController.js` | View counters no longer change `updatedAt` |
| `render.yaml` | Documents `SITE_URL`, `FRONTEND_DEPLOY_HOOK_URL`, `INDEXNOW_KEY` |
| `tests/integration/seo.test.js` | **New.** 5 tests |
| `e2e/journey-seo.js`, `e2e/package.json`, `e2e/README.md` | **New** browser and crawler journey (`npm run seo`) |

## 5. Sitemap

`https://festivo.paathly.in/sitemap.xml`. It is regenerated on every build and contains:
- the 8 public static pages;
- every active vendor page, with `lastmod` = when the listing last changed;
- every public, published, not-cancelled event from yesterday onwards, with `lastmod`.

It excludes:
- admin, auth, dashboard and account pages;
- `/delete-account`;
- private, draft, cancelled and past events;
- inactive listings;
- query-string and duplicate URLs.

Static pages have no `lastmod`, because an invented date is worse than none. A single file holds up to 50,000 URLs; the API caps each type at 5,000.

## 6. robots.txt

`https://festivo.paathly.in/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /bookings
Disallow: /messages
Disallow: /notifications
Disallow: /profile
Disallow: /admin
Disallow: /auth/
Disallow: /events/create
Disallow: /events/*/edit
Disallow: /services/create
Disallow: /services/edit/

Sitemap: https://festivo.paathly.in/sitemap.xml
```

- **Not blocked:** scripts, styles, `/assets` and `/icons` stay crawlable, so pages render for Googlebot.
- **What the Disallow lines do:** they only save crawl budget. Those pages need a login anyway, and the app marks them `noindex`.

## 7. Metadata

| Page | Title | Robots | Canonical |
|---|---|---|---|
| Home | Festivo · Book local vendors for birthdays, parties and events | index | `/` (set in browser) |
| Vendors | Event vendors near you: cakes, decor, photographers and DJs · Festivo | index | `/services` (filters and search point here) |
| Events | Public events near you · Festivo | index | `/events` |
| For vendors | Get event bookings for your business · Festivo for vendors | index | `/for-vendors` |
| Legal and contact | Terms of Service / Privacy Policy / Cancellation and Refund Policy / Contact Festivo | index | own URL |
| Vendor page | `{name} · {category} in {city} · Festivo` | index | `/services/{slug}` |
| Public event | `{title} · {date}, {city} · Festivo` | index | `/events/{slug}` |
| Private event | as above | **noindex** | none |
| Delete account | Delete your Festivo account | **noindex** | none |
| Account, dashboard, admin, auth, unknown | Festivo / Page not found · Festivo | **noindex** | none |

**Descriptions:**
- Static pages: written per page.
- Vendor and event pages: the first ~155 characters of the listing's own text, cut at a word.

**Open Graph and Twitter on every page:**
- `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale` (`en_IN`), `og:image`;
- `twitter:card` (`summary_large_image`), title, description and image.

**Preview images:**
- Vendor pages use the vendor's cover photo, and events use their cover photo.
- Everything else uses `/og-image.png` (1200×630).
- All image URLs are absolute.

`lang="en"` and the viewport tag were already correct.

## 8. Structured data (JSON-LD)

Only facts the page already shows. No invented reviews, prices or claims.

| Where | Types |
|---|---|
| Every page | `Organization`: Festivo, its logo, email, phone and the registered Bengaluru address as on the Contact page, part of Paathly. `WebSite`. |
| Vendor pages | `Service`: name, description, category, areas served, provider as `LocalBusiness` (city only), `Offer` with the real base price in INR and its unit. `AggregateRating` only when the listing has real reviews. `BreadcrumbList`: Home › Vendors › name. |
| Public events | `Event`: name, description, start date and time in IST (`+05:30`), end date, `EventScheduled`, offline, venue and address as `Place`, organizer, ticket price in INR (0 if free), image. `BreadcrumbList`. |

**Validated** with the [Schema.org validator](https://validator.schema.org/) on generated vendor and event pages: **0 errors, 0 warnings**. Recognised types: Event, Service, BreadcrumbList, WebSite.

Run Google's [Rich Results Test](https://search.google.com/test/rich-results) on a live event URL after deploy. Events are eligible for Google's event rich results; there is no rich result for `Service`.

## 9. IndexNow

**Suitable**, because listings appear and change daily, and IndexNow gets Bing (and Yandex, Seznam, Naver) to recrawl within minutes instead of days. Google does not use IndexNow; it relies on the sitemap.

**How it works:**
- The key is a value you choose. It is **public by design**: the protocol verifies it by fetching `https://festivo.paathly.in/<key>.txt`. It lives only in Render env vars, never in the repo or client code.
- The frontend build writes `/<key>.txt` when `INDEXNOW_KEY` is set.
- The backend posts to `https://api.indexnow.org/indexnow`:
  - only the URLs of listings that changed, after the rebuild that publishes them;
  - with deleted or paused vendors included, so they drop out quickly;
  - never private events.
- Failures are retried the next hour. With no key set, nothing is sent.

## 10. Validation and test results

| Check | Result |
|---|---|
| Backend test suite (Jest) | **113/113 pass** (108 existing + 5 new SEO tests) |
| Production build (`npm run build`) | Passes. `seo-build` + `seo-check` run as part of it. Initial bundle 528 kB raw against the 512 kB budget warning, which was already 520 kB before this work. |
| `seo-check` on a build with real listings | OK: 12 sitemap URLs. robots.txt valid; no sitemap URL blocked; every sitemap URL has a page, a title, a description, a self-canonical and no noindex; titles and descriptions unique; JSON-LD parses; absolute `og:image`; no `localhost` or dev hosts; every `<img>` has alt. |
| New journey `journey-seo.js` | **21/21 pass** (below) |
| Existing browser journeys (16) | **All pass**, 0 failures, no console or API errors |
| Accessibility (axe-core, WCAG 2 A/AA, 17 pages) | **No violations** |
| Phone width (no horizontal overflow) | **Pass** |
| Schema.org validator | 0 errors, 0 warnings |

**What `journey-seo.js` checks:**
- Raw HTML for a vendor page: own title, canonical, absolute preview image, `Service` JSON-LD with the real price, breadcrumbs, the app still boots.
- A public event: `Event` with an IST start time and the real ticket price.
- A private event: no page of its own, and its title appears nowhere in the HTML.
- The sitemap: has the vendor and public event, not the private event or account pages.
- robots.txt.
- In the browser:
  - vendor page tags;
  - a filtered vendor list that canonicalises to `/services`;
  - an unknown URL that gets noindex and "Page not found";
  - a private event that is noindex even for its organizer;
  - a dashboard that is noindex.
- A crawl of all internal links on the public pages: **none broken**.

### 10a. Full regression run
- **Backend:** Jest, 18 suites, **113 tests pass**.
- **Browser:** all 16 existing journeys pass (booking, events, guest RSVP, disputes, onboarding, offers, account deletion and the rest), plus the new SEO journey.
- **Re-run after the performance fixes below:** `journey-seo`, `journey-founding`, `journey-secondary`, `journey-onboarding` and a11y all pass.

### 10b. Performance (lab measurement, not field data)
**Setup:** Playwright Chromium, phone-sized screen (390×844), 4× CPU slowdown, about 8 Mbit/s with 150 ms latency, live site, median of 3 runs.

| Page | FCP | LCP | CLS before | Transfer |
|---|---|---|---|---|
| `/` | 1.2 s | 1.6 s | **0.248** | 557 kB |
| `/services` | 1.4 s | 3.4 s | **0.248** | 557 kB |
| `/for-vendors` | 1.0 s | 1.3 s | **0.342** | 546 kB |

Google's "good" thresholds: LCP ≤ 2.5 s, CLS ≤ 0.1. CLS was in the **poor** range on every page. I traced it and fixed both causes:

1. **The footer jumped on every page (0.248).**
   - The app shell (navbar + footer) paints before the page's lazy-loaded code arrives, with only 60vh reserved for the content. On a phone the footer appeared at y = 635 px and was then pushed off-screen.
   - Fix: the content area reserves a full screen (`min-height: 100vh` in `app.component.ts`).
   - After: **no footer shift** on `/`, `/services`, `/events` and `/for-vendors` under the same throttling.
2. **The "Launch period" note on `/for-vendors` (0.094) appeared above the buttons only once the payments API answered.** The sleeping free backend can take seconds to answer.
   - Fix: the page renders the note at first paint unless payments are known to be on, using the last config saved on the device (`PaymentService.lastConfig()`).
   - In production, where payments are off, the note no longer moves anything. When payments are switched on, a first-time visitor sees one small shift as the note disappears, and none after that.

**LCP on `/services` (3.4 s)** waits for the vendor list from the API. A cold free-plan backend is the main factor; a paid always-on instance fixes most of it. Not changed here.

The measurement script is not committed (it hits the live site). Repeat with PageSpeed Insights after deploy.

## 11. Remaining technical issues (cannot be fixed in code here)

1. **Soft 404s.** Render's static hosting returns HTTP 200 for unknown URLs. The app marks them noindex, and Google treats noindexed "not found" pages correctly, but a real 404 status needs a server, or edge rules Render does not offer.
2. **Trailing slashes.**
   - Render serves `/terms` and `/terms/` from the same file and cannot be configured to redirect.
   - Mitigation: every page's canonical is the no-slash URL, and the sitemap uses only those.
3. **The Render default host** (`*.onrender.com`) serves the same site.
   - Mitigation: canonical tags point to `festivo.paathly.in`.
   - Do not link to the onrender address anywhere.
4. **New listings between rebuilds** have correct tags in the browser (Google), but the generic preview card for WhatsApp and Facebook until the next rebuild, at most about 6 hours.
5. **The free backend plan sleeps.** The hourly job only runs while the API is awake, so rebuild and IndexNow timing depends on traffic. A paid instance, which you were already considering, makes it reliable.
6. **Bundle budget.** The initial JS is 528 kB raw. `main` is 29 kB gzipped; the rest is eagerly loaded shared chunks. It was already over the budget before this work. Worth a separate look at what the navbar and footer pull in eagerly.
7. **Core Web Vitals** were not measured on real users: there is no field data yet for a site this new. The lab measurement in 10b found and fixed the layout shifts; `/services` LCP (3.4 s) depends on API speed.
8. **The rename.** When Festivo gets its new name and domain, change `siteUrl` and `siteName` in `src/app/core/seo/site.json`, the defaults in `src/index.html` and `SITE_URL` on the backend. Then add 301 redirects from the old domain and use Search Console's Change of Address tool.

## 12. Manual steps that need your accounts

**Render** (both services)
- [ ] Push `backend` and `frontend` (`main`) so both redeploy.
- [ ] `festivo-frontend` → Settings → **Deploy Hook** → copy the URL.
- [ ] `festivo-backend` → Environment:
  - `FRONTEND_DEPLOY_HOOK_URL` = that URL (keep it secret: anyone with it can trigger builds);
  - `SITE_URL` = `https://festivo.paathly.in`;
  - `INDEXNOW_KEY` = a key you generate (32 hex characters, e.g. `openssl rand -hex 16`).
- [ ] `festivo-frontend` → Environment → `INDEXNOW_KEY` = the **same** key. Then redeploy and open `https://festivo.paathly.in/<key>.txt` to confirm it shows the key.
- [ ] After the deploy, open `https://festivo.paathly.in/sitemap.xml` and `/robots.txt`, and check that a vendor page's source (view-source) shows its own `<title>`.

**Google Search Console** ([search.google.com/search-console](https://search.google.com/search-console/))
- [ ] Add a **Domain property** for `paathly.in`. That covers every subdomain, http and https, and the future renamed site if it stays on paathly.in.
- [ ] Verify with the **DNS TXT record** Google gives you, added at your DNS provider for `paathly.in`. (A URL-prefix property with an HTML tag also works, but then send me the exact `google-site-verification` code to add; I won't make one up.)
- [ ] Sitemaps → submit `https://festivo.paathly.in/sitemap.xml`.
- [ ] URL Inspection on `/`, `/services`, `/for-vendors`, one vendor page and one public event. Check the indexed version: "View tested page" → screenshot and HTML show the content. Then "Request indexing".
- [ ] Over the next 1 to 4 weeks, check **Pages** (indexing report: look for "Excluded by noindex", which should only be private pages, and "Soft 404") and **Performance** (queries, clicks, CTR).
- [ ] Enhancements → **Events** appears once event pages are indexed. Fix anything it reports.

**Bing Webmaster Tools** ([bing.com/webmasters](https://www.bing.com/webmasters/))
- [ ] Add the site → **Import from Google Search Console**. This is the fastest route and verifies automatically. Alternatively verify with a DNS CNAME or an XML file; send me a file or meta code and I'll add it.
- [ ] Sitemaps → submit `https://festivo.paathly.in/sitemap.xml`.
- [ ] IndexNow → check that pings show up after the first listing change.
- [ ] URL Inspection on a vendor page; Site Scan once for crawl errors.

**Search results and social previews**
- [ ] Test a vendor link in WhatsApp: it should show the vendor's photo and name.
- [ ] Use the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) to refresh old cached previews.
- [ ] Run the [Rich Results Test](https://search.google.com/test/rich-results) on one live public event URL.

## 13. Recommended next steps (in order of value)

1. **Get real vendors listed with good photos and descriptions.**
   - Each vendor page is now a search landing page.
   - Description quality is the page's search snippet, so prompt vendors to write 2 to 3 specific sentences ("eggless theme cakes in HSR Layout, 1–3 kg, order 2 days ahead"). Customers search exactly like that.
2. **City + category landing pages, once each has 3 or more vendors.**
   - Examples: `/bengaluru/birthday-decoration`, `/bengaluru/custom-cakes`, `/bengaluru/birthday-photographers`.
   - Competitors rank with exactly this structure:
     - CherishX: `cherishx.com/experience/…/bangalore/…`;
     - Giftlaya: `giftlaya.com/balloon-decorations/bangalore/koramangala`;
     - 7eventzz: `7eventzz.com/balloon-decoration/bangalore`.
   - Each page needs its own short intro, the real vendors with prices and an FAQ. Don't create them before there are vendors: thin pages hurt more than they help.
   - Primary intents:
     - "birthday decoration at home bangalore";
     - "balloon decoration bangalore";
     - "custom/theme cake home baker bangalore";
     - "birthday photographer bangalore";
     - "kids birthday party planner bangalore".
   - Secondary: locality modifiers (Koramangala, HSR, Indiranagar, Whitefield), "eggless", "first birthday", "same day".
3. **Price-guide content, a handful of genuinely useful pages, not hundreds.**
   - Examples: "How much does birthday decoration at home cost in Bengaluru?", or "What to ask a home baker before ordering a custom cake", with the real price ranges from your competitor research.
   - These earn links and lead straight to vendor pages.
4. **Vendor backlinks.** Each vendor's Instagram bio and Google Business Profile should link to their Festivo page; the QR card already does this offline.
5. **Google Business Profile** for Festivo/Paathly in Bengaluru, using the same name, address and phone as the Contact page.
6. **Measure Core Web Vitals in the field** once traffic exists: Search Console → Core Web Vitals, or PageSpeed Insights on live URLs.
7. **If organic search becomes a main channel**, consider Angular SSR on a Node web service. It would give real 404 status codes and server-rendered content for every crawler. The current setup is a deliberate, low-risk first step.

Sources for section 13: [CherishX Bangalore](https://cherishx.com/experience/6750/bangalore/justice-league-birthday-decor), [Giftlaya](https://giftlaya.com/balloon-decorations/bangalore/koramangala), [7eventzz](https://7eventzz.com/balloon-decoration/bangalore), [Swiggy: birthday cakes in Bangalore](https://blog.swiggy.com/order-food-online/best-birthday-cakes-in-bangalore/), [MomJunction: custom cakes in Bangalore](https://momjunction.com/articles/places-to-order-custom-cakes-in-bangalore_00102178).
