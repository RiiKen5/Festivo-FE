# Festivo — Marketing Product Analysis

_October 2026 · based on the live product (festivo.paathly.in), its code, and market research. Numbers marked **assumption** are estimates to validate, not data._

## What the product does

Festivo is a two-sided marketplace for **small, personal events** (birthdays, anniversaries, house parties, farewells, society get-togethers, meetups), with event tools attached:

| For | Festivo lets them |
|---|---|
| People planning an event | Find local vendors (cakes, decor, photography, DJ, venues, catering), request a booking, get the vendor's final quote, pay online (full or 30% advance) with the money **held until they confirm delivery**, chat, review |
| Vendors (mostly small/home businesses) | List services with photos and prices, receive structured requests, quote, get paid to UPI/bank after the job, collect verified reviews |
| Hosts | Create public or private (invite-link) events, collect RSVPs, sell tickets, check guests in by code, keep a planning checklist |
| Guests | RSVP from a link, buy tickets, get a check-in code, automatic refunds if cancelled |

Revenue: **15%** commission on vendor bookings paid online, **5%** on tickets. Free to join and list.

## The problem, by side

**Organizer (demand).** Booking small-event vendors today means Instagram DMs, WhatsApp chats and cash/UPI advances to people you've never met. Pain: trust (will they show up, will I get my advance back), comparison (prices are hidden in DMs), coordination (requirements and payment proof scattered in chats).
- Urgency: high, but episodic. Bookings happen 3–30 days before a dated event.
- Frequency: low per person (a few events a year). **Retention will be weak on the organizer side by nature**; acquisition must be cheap.

**Vendor (supply).** Home bakers and decorators find customers on Instagram/WhatsApp, chase advances, lose track of who paid, and suffer last-minute cancellations (research: orders scattered across chat apps, advances tracked in notebooks; deposits + clear cancellation windows are the standard fix).
- Urgency: constant. This is their livelihood, and they process orders weekly.
- Frequency: high. **Vendors are the retained, repeat side of the marketplace.**

**Guest.** Low pain individually; valuable as **exposure**: every event puts Festivo in front of 10–80 guests, a share of whom plan events themselves.

## Core value proposition

> Book the people who make your event happen, and your money stays protected until the job is done.

The defensible part is not "a list of vendors" (Google, JustDial and Instagram already do that). It is **the transaction**: quote → protected payment → delivery confirmation → payout → verified review. No directory offers that, and chat apps cannot.

## Differentiators (true today)

1. Payment held until the organizer confirms delivery; automatic, published refund rules.
2. Vendors set their own final price (quote step), with no fixed packages.
3. Reviews only from completed bookings.
4. Invites, RSVPs, tickets and check-in in the same product as vendor booking.
5. Built for small events, not weddings (where competitors concentrate).

## "Aha" moments

- **Organizer:** the vendor confirms a quote and the "Pay securely, held until delivery" button appears. Trust becomes concrete.
- **Vendor:** the first notification "₹X paid online, released after the event". A customer who has already paid.
- **Host:** guests RSVP from the WhatsApp invite link and appear in the guest list.

## Activation events (from product behaviour)

| Side | Activation | Why |
|---|---|---|
| Organizer | **Sends first booking request** (`booking_requested`) | First moment Festivo does work no directory does |
| Organizer (strong) | First booking **paid online** | Revenue + trust established |
| Vendor | **Listing live with ≥1 photo** (setup) → **first confirmed booking** (activation) | A listing without bookings churns; first booking makes it real |
| Host | Event created **and ≥3 RSVPs** | Proves the invite loop worked |
| Guest | RSVP / ticket | Exposure; converts when they later create an event |

**North-star metric:** completed bookings paid online per month (proxy for GMV and trust). Secondary: active vendors (≥1 confirmed booking in 30 days).

## Market

- Category: local services marketplace for personal events / celebrations, with event ticketing attached.
- Adjacent players: wedding marketplaces (WedMeGood, ShaadiSaga and others), managed celebration services (CherishX), directories (JustDial, Sulekha, Google Maps), gifting/cake brands (FNP, Bakingo, Winni), ticketing (BookMyShow-owned Townscript, AllEvents, KonfHub, District, Luma). See `marketing-competitive-analysis.md`.
- Maturity: weddings are saturated; **small celebrations are fragmented and largely offline/Instagram-driven**. That is the opening.
- Willingness to pay: organizers already pay vendors ₹1,500–15,000 per service; Festivo's fee is taken from the vendor's side, so the organizer pays the listed price. Vendors' willingness to pay 15% is **unproven** and the single biggest economic risk.

## Current state of the funnel (audit)

| Stage | State |
|---|---|
| Landing | Honest, clear hero; how-it-works; vendor section. No social proof yet (none exists). |
| Signup | Email + password or Google; **email verification required before first login** (friction; deliverability-dependent). |
| Onboarding | No guided onboarding; dashboard shows empty states with next actions. Vendor signup does not route to "create listing". |
| Activation | Booking request flow works; payments disabled until Razorpay is live. |
| Retention | In-app notifications only; no email/WhatsApp lifecycle messages. |
| Referral | Invite links and share buttons exist; no attribution on them; no "plan your own event" path for guests. |
| Analytics | **None.** No product analytics, no UTM capture, no funnel. |
| SEO | SPA (client-rendered); generic meta; Open Graph image added; no per-page previews, no sitemap of listings. |

## Constraints that shape the strategy

1. **Cold start.** Zero real vendors or users. Demand marketing before supply exists burns money and trust.
2. **Payments not live yet** (Razorpay activation pending). Until then the core differentiator can't be demonstrated with real money.
3. **SPA hosting.** Vendor/event pages can't produce per-page link previews or rank well without server rendering.
4. **Small team, no ad budget assumed.**
