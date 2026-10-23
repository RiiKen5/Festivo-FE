# Acquisition Strategy

## The distribution advantage

Festivo's cheapest, most reliable source of users is **its vendors**.

Home bakers and decorators already have customers (Instagram followers, WhatsApp contacts, repeat clients). They hate chasing advances. If Festivo gives them a **booking link that collects a protected payment**, they put it in their Instagram bio and send it in WhatsApp chats. Each vendor then becomes a free, trusted acquisition channel for organizers, who then see *other* vendors and invite *guests*.

Competitors can't copy this easily: directories don't transact, managed brands compete with these vendors, and ticketing tools have no vendors.

The second advantage is **events themselves**: every invite link and ticket page puts Festivo in front of 10–200 guests.

## Channel scorecard

Scores 1–5 (5 = best; for cost and effort, 5 = cheapest/easiest). Total = fit + intent + cost + scale + speed + retention + effort + confidence.

| Channel | Fit | Intent | Cost | Scale | Speed | Retention | Effort | Conf. | Total | Class |
|---|---|---|---|---|---|---|---|---|---|---|
| Direct vendor outreach (Instagram DMs, calls, supply stores) | 5 | 4 | 4 | 2 | 5 | 5 | 3 | 5 | **33** | Primary |
| Vendor-shared booking links ("Book me on Festivo") | 5 | 5 | 5 | 4 | 4 | 3 | 4 | 3 | **33** | Primary |
| Event invite & ticket loop (guests → hosts) | 4 | 3 | 5 | 4 | 3 | 3 | 4 | 3 | **29** | Primary |
| Vendor WhatsApp/Facebook communities (value-first) | 5 | 3 | 5 | 3 | 4 | 4 | 3 | 3 | **30** | Secondary |
| Local SEO (category × area pages) | 4 | 5 | 4 | 4 | 1 | 2 | 2 | 3 | **25** | Secondary (after SSR + supply) |
| Housing-society & community partnerships | 4 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | **26** | Secondary |
| Instagram organic (reels of real events) | 4 | 2 | 4 | 3 | 3 | 2 | 3 | 3 | **24** | Experimental |
| Local micro-influencers (mom/kid creators) | 4 | 3 | 3 | 3 | 3 | 2 | 3 | 2 | **23** | Experimental |
| Google Search ads ("balloon decoration Pune") | 4 | 5 | 2 | 4 | 5 | 2 | 3 | 3 | **28** | Later (needs analytics + supply + payments) |
| Meta ads | 3 | 2 | 2 | 4 | 4 | 2 | 3 | 2 | **22** | Low priority |
| PR / startup press | 2 | 1 | 4 | 2 | 3 | 1 | 4 | 2 | **19** | Low priority |
| Product Hunt, Reddit, X, LinkedIn | 1 | 1 | 5 | 1 | 4 | 1 | 4 | 1 | **18** | Not now (wrong audience) |
| Cold email, affiliate programs, app stores | 1 | 1 | 3 | 2 | 2 | 1 | 2 | 1 | **13** | Not now |

## Top 5 ways to get users

### 1. Hand-onboard 30–50 Pune vendors in 3 launch categories (supply)
- **Why it fits:** marketplaces die empty; vendors are the retained side and the distribution channel.
- **Audience:** home bakers (custom cakes), balloon/floral decorators, freelance photographers in 4–6 Pune neighbourhoods.
- **Execute:** shortlist from Instagram hashtags/location tags and Google Maps; DM + call; offer to create their listing *for* them (photos, price, areas) in a 15-minute call; verify them in Admin. Visit cake-supply and balloon wholesale shops to meet vendors in person.
- **Product changes:** vendor landing page (`/for-vendors`), vendor signup that leads straight to "create listing", share-your-listing link. *(built in this pass)*
- **Difficulty:** medium (manual). **Scalability:** low per person but compounding.
- **Key metric:** vendors with a live listing + ≥1 photo; vendors with ≥1 confirmed booking.
- **Test first:** 20 DMs with message A ("customers pay before the event") vs B ("free listing, new customers"); measure reply → listing rate.

### 2. Vendor-led demand: the "Book me on Festivo" link
- **Why it fits:** vendors already have customers; a protected-payment link is something they *want* to send.
- **Execute:** every vendor gets a share link (WhatsApp, copy, Instagram bio) from My Services. Coach launch vendors to send it to their next 3 customers.
- **Product changes:** share link with attribution *(built)*; later, a **lower fee for customers the vendor brings** (experiment E3), because a 15% cut on their own customers is the biggest objection.
- **Difficulty:** low–medium. **Scalability:** high (grows with every vendor).
- **Key metric:** signups attributed to `vendor_share`; % of those who send a booking request.
- **Test first:** 10 launch vendors, 2 weeks: how many customers book through the link at 15% vs a "bring your own customer" reduced fee.

### 3. Invite & ticket loop (guests → hosts)
- **Why it fits:** each event exposes Festivo to many people at the exact moment they're thinking about events.
- **Execute:** invite links shared on WhatsApp; ticket pages; a "Planning your own event?" prompt for guests.
- **Product changes:** attribution on invite/share links and a guest → organizer prompt *(built)*; per-event link previews (needs server rendering, P2).
- **Difficulty:** low. **Scalability:** high, if events are frequent.
- **Key metric:** guest-to-organizer conversion; signups from `invite`.
- **Test first:** guest prompt copy and placement; measure event creations by people who first arrived as guests.

### 4. Recurring hosts and communities (housing societies, meetup organizers, college clubs)
- **Why it fits:** recurring events mean retention, and each event feeds loop 3.
- **Execute:** offer free ticketing/RSVP for society festivals (Diwali, Holi, Christmas) and monthly meetups in Pune; help them set up the first event.
- **Product changes:** none required now. Later: recurring events, co-host roles.
- **Key metric:** events with ≥10 RSVPs; repeat events per host.
- **Test first:** 5 societies for one festival.

### 5. Local search for date-driven intent (after supply + server rendering)
- **Why it fits:** organizers search with high intent 1–4 weeks before a date ("balloon decoration at home Baner").
- **Execute:** category × area landing pages that list real vendors, real prices and real reviews (not empty templates).
- **Product changes:** server-side rendering/prerender for public pages, sitemap from the API, structured data. See `seo-strategy.md`.
- **Difficulty:** high. **Scalability:** high and compounding.
- **Key metric:** organic signups → booking requests.
- **Test first:** 3 hand-built pages for the strongest category × area pairs once ≥8 vendors cover them.

## How do we get a lot of users?

- **First 100:** founder-led. 30–50 vendors onboarded by hand; each brings 1–3 customers via their link; friends-and-family events using invites. *Not ads.*
- **Next 1,000:** vendor-led links at scale (100+ vendors), society/meetup hosts, guest → host conversion, vendor communities.
- **10,000+:** compounding local SEO across categories × neighbourhoods, then city #2 using the same playbook; paid search on proven high-intent keywords once CAC < first-booking contribution.
- **Sustainable (no rising spend):** vendor-led links + invite loop + SEO. All three grow with usage.
- **Viral:** yes, through invites/tickets (guests) and vendor links (customers). It's not a "refer a friend" product.
- **Organic discovery by the product itself:** event pages, ticket pages and vendor pages are public, shareable artefacts.

## Paid acquisition

**Not now.** Requirements not met: no analytics baseline, no payments live, no supply density. Revisit Google Search ads (exact-match, Pune, 2–3 categories) when:
1. ≥15 active vendors per tested category;
2. funnel tracking shows request → paid conversion;
3. contribution per first booking is known (e.g. ₹2,000 booking × 15% = ₹300 before gateway fees). CAC must stay well below this, since organizers book infrequently.

## Classification (build vs other)

| Recommendation | Type |
|---|---|
| Vendor landing page, vendor signup → create listing, share links with attribution, guest → host prompt, first-touch attribution, analytics events, admin growth dashboard | BUILD (done in this pass) |
| Analytics provider key (PostHog) | CONFIGURE |
| Vendor outreach, society partnerships, onboarding calls | MANUAL |
| Instagram content, vendor stories, outreach scripts | CONTENT |
| Google Search Console, Google Business Profile, PostHog account | EXTERNAL |
| Server rendering + local SEO pages, lower fee for vendor-brought customers, WhatsApp notifications | BUILD (later, P1–P2) |
| Paid ads, PR, Product Hunt, app stores, referral rewards | NOT NOW |
