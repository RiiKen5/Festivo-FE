# SEO Strategy

## Is SEO a strong channel for Festivo?

**Yes, but not yet.** Organizers search with clear, date-driven, local intent ("custom birthday cake Kothrud", "balloon decoration at home Pune price"). These long-tail local queries are less contested than wedding keywords, and they convert. But SEO only works once:

1. there are real vendors to show on each page (empty category pages are worse than none);
2. public pages are **server-rendered** so search engines and link previews see real content.

Until then SEO is a foundation task, not an acquisition channel.

## Technical audit (live site)

| Item | Status | Action |
|---|---|---|
| Rendering | Client-side Angular SPA; every URL returns the same HTML shell | **P2:** Angular SSR (Node) or prerender of public routes; needs a Node host instead of a static host |
| Titles/descriptions | One global title + description | With SSR: per page (vendor name + category + area; event title + date) |
| Open Graph | Site-wide card + image added | With SSR: per vendor/event preview (photo, price, date). This is what makes WhatsApp shares convert |
| robots.txt | Added; private app routes disallowed | Done |
| Sitemap | None (`/sitemap.xml` falls back to the app) | **P2:** generate from the API (public events + active services), submit to Search Console |
| Canonical URLs | None | With SSR: canonical = slug URL (pages also resolve by id) |
| Structured data | None | With SSR: `LocalBusiness` + `AggregateRating` for vendors (only real reviews), `Event` for public events |
| Internal linking | Home → lists → detail | Add category × area hub pages once supply exists |
| Speed | Lazy-loaded routes, small CSS; cold-starting backend on free tier hurts | Paid backend tier (no cold starts) |
| Search Console | Not set up | **EXTERNAL, now:** verify festivo.paathly.in, submit sitemap when ready |
| Google Business Profile | None | **EXTERNAL:** create for Festivo (Pune) once the support contact is real |

## Search intent map (Pune launch)

| Level | Example queries | Page type | Priority |
|---|---|---|---|
| High intent (ready to book) | "balloon decoration at home pune", "custom birthday cake delivery kothrud", "birthday photographer pune price" | Category × area page listing real vendors with prices | P1 once supply exists |
| Problem-aware | "how to plan a surprise birthday at home", "birthday decoration ideas at home" | Guide that ends in "book a decorator near you" | P2 |
| Solution-aware | "party planner app", "book event vendors online" | Home / how-it-works | Existing |
| Product-aware / comparison | "cherishx alternative", "justdial decorators reviews" | Comparison page (factual, no disparagement) | P3 |
| Event discovery | "events in pune this weekend", "house party tickets pune" | Public events listing + event pages | P2 (needs public events volume) |

Prioritize the high-intent row. A page earns its place only if it has **≥8 real vendors** with prices and photos.

## Programmatic pages: rules

Build `/{city}/{category}/{area}` pages (e.g. `/pune/balloon-decorators/baner`) only when:
1. the combination has ≥8 active vendors serving that area;
2. each page shows unique, real content (vendor cards, price range from real listings, real review snippets, area-specific notes);
3. thin combinations stay `noindex` until they qualify.

No templated text-only pages. No fake locations.

## AI/answer-engine readiness

Clear, factual public pages: how it works, fees, refund policy, FAQ. These are what answer engines quote. Already true for legal/how-it-works content; add an FAQ page with real answers when support questions accumulate.
