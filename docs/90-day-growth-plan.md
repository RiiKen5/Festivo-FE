# 90-Day Growth Plan (Pune launch)

Goal by day 90: **a working marketplace in 3 categories in Pune**, measured by completed online-paid bookings, not signups.

Targets are planning assumptions, not forecasts. Revise them after the first 30 days of data.

## Pre-launch blockers (week 0)

These are in the production checklist and must be done before outreach: Razorpay live keys and webhook; real business details in Terms/Privacy; working SMTP; a real admin account and demo data removed (`seed-demo.js --remove`); Google OAuth origin for festivo.paathly.in; paid backend tier (no cold starts) with database backups.

## Days 1–30: Foundation

| Area | Action | Type |
|---|---|---|
| Positioning | Use value props A (organizers) and B (vendors) from `positioning-strategy.md` everywhere: landing pages, DMs, bios | CONTENT |
| Analytics | Create PostHog project, set `posthogKey`, build the 4 funnels in `analytics-event-taxonomy.md`; check Admin → Growth weekly | CONFIGURE / EXTERNAL |
| Landing page | `/for-vendors` is live; tag every outreach link (`utm_source=instagram&utm_medium=dm&utm_campaign=…`) | BUILD (done) / MANUAL |
| Supply | Shortlist 150 Pune vendors (cakes, balloon/floral decor, photography) in 4–6 neighbourhoods; run E1 and E2; target **30 live listings with photos** | MANUAL |
| Activation | New vendors land on "create listing"; coach every vendor to share their link (E4) | BUILD (done) / MANUAL |
| SEO | Verify Search Console; create Google Business Profile once the support contact is real | EXTERNAL |
| Demand | Founder network + launch vendors' own customers; target **first 10 completed paid bookings** | MANUAL |

## Days 31–60: Distribution

| Area | Action | Type |
|---|---|---|
| Vendor-led demand | Scale to 60–80 vendors; measure `vendor_share` signups → requests; decide on E3 (lower fee for own customers) and build it if the data supports it | MANUAL / BUILD |
| Partnerships | 5 housing societies or meetup hosts for a festival/monthly event (E6) | MANUAL |
| Content | Real event reels with vendor consent, 2–3/week; vendor spotlights | CONTENT |
| Loops | Watch guest → host conversion (E5); add cross-sell after booking (E8) if bookings per event is low | BUILD |
| Retention | Review request after completion; vendor monthly summary (bookings, earnings) | BUILD |
| SEO | Decide on server rendering for public pages (needs a Node host); generate sitemap | BUILD |

## Days 61–90: Scale

| Area | Action | Type |
|---|---|---|
| Double down | Put 80% of time into the best channel by "completed paid bookings per hour of effort" from the Growth tab | MANUAL |
| SEO | First 3 category × area pages where ≥8 vendors exist (E9) | BUILD / CONTENT |
| Supply depth | 100+ vendors; ≥15 per launch category | MANUAL |
| Paid test | Only if payments are live, the funnel baseline exists and contribution per booking is known: a small exact-match Google Search test (E10) | EXTERNAL |
| City #2 | Write the Pune playbook; do not expand until Pune repeat bookings exist | MANUAL |

## Weekly review (30 minutes)

1. North star: completed online-paid bookings (Admin → Growth).
2. Signups and activation by source.
3. Vendors: live listings, % who accepted a booking.
4. Experiments: update `growth-experiments.md`.
5. One decision: what to stop, what to double.
