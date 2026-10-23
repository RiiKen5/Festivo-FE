# Growth Loops

Loops that fit Festivo's actual mechanics, in priority order.

## Loop 1 — Vendor-led demand (primary)

```
Vendor lists service
  → shares "Book me on Festivo" link with their own customers (bio, WhatsApp)
  → customer signs up, books, pays (protected)
  → customer sees other vendors for the same event (cake → decor → photographer)
  → books more vendors → those vendors get paid → they share their links too
```

- **Why it works:** vendors want protected payments and already own the customer relationship.
- **Built:** share link per listing (`utm_source=vendor_share`), first-touch attribution, admin growth view.
- **Next:** "bring your own customer" fee (experiment E3); cross-sell prompt after a booking ("Need decor too?").
- **Metric:** signups and booking requests attributed to `vendor_share`.

## Loop 2 — Event exposure (guests → hosts)

```
Host creates event → shares invite/ticket link (WhatsApp)
  → guests open Festivo, RSVP / buy ticket
  → some guests plan their own events → "Planning your own event?" → create event
  → they invite their guests
```

- **Built:** UTM on invite/WhatsApp shares (`utm_source=invite`), guest → host prompt on event pages, attribution.
- **Next:** per-event link previews (needs server rendering), post-event "Host your own" message.
- **Metric:** guest → organizer conversion within 60 days.

## Loop 3 — Marketplace density (supply ↔ demand)

```
More vendors per category/area → better choice and prices → more organizers book
  → vendors see orders → more vendors join (word of mouth in vendor groups)
```

- Grows slowest; fuelled by manual onboarding (Loop 1 seeds it).
- **Metric:** % of booking requests confirmed within 24h; vendors with ≥1 booking/month.

## Loop 4 — Reviews → trust → conversion (supports all loops)

```
Completed booking → verified review → better vendor page → higher request rate
```

- Already built (reviews only from completed bookings). Next: review request after completion (lifecycle message).

## Loops we're NOT building

- **Cash referral rewards ("invite a friend, get ₹100"):** organizers book rarely; economics don't support it yet and it attracts fraud.
- **Content/UGC loop:** no user-generated public content beyond events and reviews.
