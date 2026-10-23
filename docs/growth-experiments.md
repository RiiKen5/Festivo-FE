# Growth Experiment Backlog

Effort/impact/confidence: L / M / H. Status: Ready, Running, Done, Blocked. Update **Result** when an experiment ends; keep losers in the list.

| # | Experiment | Hypothesis | Audience | Channel | Effort | Impact | Conf. | Metric | Priority | Status | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|
| E1 | Outreach message A ("customers pay before the event") vs B ("free listing, new customers") | Payment protection is a stronger hook than discovery for home vendors | Pune home bakers/decorators on Instagram | DM, tagged links per variant (`utm_campaign=dm-a` / `dm-b`) | L | H | M | Reply rate; listing created within 7 days | P0 | Ready | — |
| E2 | Done-for-you listing on a 15-min call vs self-serve link | Vendors drop off at listing creation; doing it for them doubles activation | Vendors who replied to outreach | Phone/WhatsApp | M | H | H | Live listings with photos per 10 replies | P0 | Ready | — |
| E3 | Lower fee for customers the vendor brings (e.g. 5% vs 15%) | 15% on their own customers is the main objection; a lower rate makes vendors share their link | 10 launch vendors | Vendor share links | M (needs per-booking fee rule) | H | M | Bookings via `vendor_share` per vendor per month; vendor retention | P1 | Blocked (needs build) | — |
| E4 | "Your Festivo link" coaching after onboarding | Vendors who are told exactly where to put the link share it 2× more | New vendors | WhatsApp message + guide | L | M | M | `listing_shared` per vendor in first 14 days | P0 | Ready | — |
| E5 | Guest → host prompt copy/placement | A prompt on event pages converts some guests into hosts | Guests on event pages | Product | L | M | L | `host_cta_clicked` → `event_created` | P1 | Running (prompt shipped) | — |
| E6 | Free RSVP + ticketing for 5 housing-society festival events | Societies need RSVPs/tickets and bring 50–200 guests each | Society committees in Pune | In-person, WhatsApp | M | M | M | Events with ≥20 RSVPs; signups from `invite` | P1 | Ready | — |
| E7 | Value-first posts in home-baker WhatsApp/Facebook groups (with admin permission) | Communities produce cheaper vendor signups than 1:1 DMs | Home-baker groups | Community, `utm_source=fb_group` | L | M | L | Vendor signups per post | P2 | Ready | — |
| E8 | Cross-sell after a booking ("Need decor too?") | Organizers booking a cake also need decor/photos | Organizers with a confirmed booking | Product | M | M | M | Bookings per event | P2 | Ready (needs build) | — |
| E9 | 3 hand-built category × area pages (once ≥8 vendors each) | High-intent local searches convert to requests | Organizers searching on Google | SEO | H (needs SSR) | H | M | Organic signups → booking requests | P2 | Blocked (supply + SSR) | — |
| E10 | Google Search ads, exact match, one category in Pune | Paid search is profitable for high-intent queries | Organizers | `utm_source=google&utm_medium=cpc` | M | M | L | CAC vs contribution per first booking | P3 | Blocked (payments live + funnel baseline) | — |

## Rules

- One change per experiment; tag every link so the Growth tab can attribute it.
- Minimum run: 2 weeks or 30 outcomes, whichever comes first. With small numbers, treat results as directional.
- Record the decision (keep / kill / iterate) in **Result**.
