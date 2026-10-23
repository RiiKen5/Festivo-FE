# Analytics Event Taxonomy

## How tracking works

| Layer | What | Where |
|---|---|---|
| First-touch attribution | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `ref`, external referrer, landing page, first-seen time. Captured on the first visit and kept in `localStorage` (`festivo_first_touch`); later visits never overwrite it | `core/services/attribution.service.ts` |
| Signup attribution | The first touch is sent with email and Google signups and stored on `User.acquisition` (cleaned server-side; never returned by the API) | `backend/src/utils/acquisition.js`, `authController` |
| Product events | `AnalyticsService.track()` sends to **Google Analytics 4** (gtag.js) **only if** `gaMeasurementId` is set in `environment.prod.ts`; otherwise it does nothing. Production builds use `environment.prod.ts`; local runs never send analytics | `core/services/analytics.service.ts` |
| Server metrics | Admin → **Growth** tab (`GET /api/v1/admin/growth?days=30`): signups by source, activation by source, funnel counts, north star | `adminController.getGrowth` |

The admin Growth tab works **without** Google Analytics: it is computed from the database, so it is the source of truth for signups and bookings. GA adds traffic sources for visitors who never sign up, funnels (Explore → Funnel exploration), retention and page-level behaviour.

### Turning on Google Analytics (CONFIGURE)
1. In Google Analytics, create a GA4 property and a **Web** data stream for `https://festivo.paathly.in`. Copy the measurement ID (`G-XXXXXXXXXX`).
2. Put it in `frontend/src/environments/environment.prod.ts` → `gaMeasurementId`, commit and deploy.
3. In the data stream's *Enhanced measurement* settings, turn **off** "Page changes based on browser history events". The app sends its own `page_view` on each route change, so leaving it on would double-count.
4. Admin → Custom definitions: register the event parameters you want in reports (`source`, `campaign`, `method`, `user_type`, `category`, `channel`, `placement`, `own`) and the user properties `user_type`, `city`, `first_source`, `first_campaign`.
5. Admin → Events: mark `signup_completed`, `service_created`, `booking_requested`, `payment_completed` and `ticket_purchased` as **key events**.
6. Optional: set data retention to 14 months and link Google Search Console.
7. The privacy policy already names Google Analytics.

## Naming rules

- `object_action`, past tense, snake_case: `booking_requested`.
- Properties: IDs, categories, amounts, channels. **No names, emails, phone numbers or message text.**
- Users are identified by database ID only (GA `user_id`); user properties are `user_type`, `city`, `first_source`, `first_campaign`.
- GA limits: event names ≤ 40 characters, parameter values ≤ 100 characters, ≤ 25 parameters per event.

## Events

| Event | Fired when | Properties | Funnel role |
|---|---|---|---|
| `page_view` | Every route change | `page_path`, `page_location`, `page_title` | Traffic |
| `signup_completed` | Email registration submitted or new Google account | `method`, `userType`, `source`, `campaign` | Acquisition |
| `vendor_cta_clicked` | "List your service" on `/for-vendors` | `placement` (hero/footer) | Supply acquisition |
| `service_created` | Vendor publishes a listing | `serviceId`, `category` | **Vendor activation step 1** |
| `listing_shared` | Share from My Services or a service page | `serviceId`, `channel`, `own` | Loop 1 (vendor-led demand) |
| `event_created` | Organizer creates an event | `eventId`, `eventType`, `isPublic`, `isPaid` | Organizer/host activation |
| `invite_shared` | Invite or event link copied/shared | `eventId`, `channel`, `private` | Loop 2 (guest exposure) |
| `host_cta_clicked` | Guest clicks "Planning your own event?" | `eventId` | Loop 2 conversion |
| `booking_requested` | Organizer sends a booking request | `bookingId`, `serviceId`, `price` | **Organizer activation** |
| `booking_confirmed` | Vendor confirms with a quote | `bookingId`, `price` | Supply responsiveness |
| `payment_completed` | Razorpay payment verified (booking or ticket) | `amount`, `currency` | Revenue |
| `rsvp_created` | Guest RSVPs | `eventId`, `status`, `viaInvite` | Host activation (≥3 RSVPs) |
| `ticket_purchased` | Paid ticket confirmed | `eventId`, `amount` | Revenue |

## UTM conventions

| Link | `utm_source` | `utm_medium` | Set by |
|---|---|---|---|
| Vendor shares own listing | `vendor_share` | `link`, `whatsapp`, `copy`, `x` | Product (automatic) |
| Someone else shares a listing | `listing_share` | channel | Product |
| Private invite link | `invite` | `whatsapp`, `copy` | Product |
| Public event share | `event_share` | channel | Product |
| Founder outreach DMs | `instagram` / `whatsapp` | `dm` | Manual, e.g. `/for-vendors?utm_source=instagram&utm_medium=dm&utm_campaign=pune-bakers` |
| Vendor community posts | `fb_group` / `whatsapp_group` | `community` | Manual (`utm_campaign` = group name) |
| Society partnerships | `society` | `partner` | Manual (`utm_campaign` = society name) |
| Paid search (later) | `google` | `cpc` | Ads platform |

Untagged visits fall back to the referring site (`google`, `instagram`, `facebook`, `whatsapp`, other host) or `direct`.

## Key funnels to build in GA (Explore → Funnel exploration)

1. **Vendor:** `/for-vendors` pageview → `vendor_cta_clicked` → `signup_completed` (userType helper) → `service_created` → `booking_confirmed` → payout.
2. **Organizer:** pageview → `signup_completed` → `event_created` → `booking_requested` → `payment_completed`.
3. **Vendor-led demand:** `listing_shared` → visit with `utm_source=vendor_share` → `signup_completed` → `booking_requested`.
4. **Guest → host:** `rsvp_created` / `ticket_purchased` → `host_cta_clicked` → `event_created`.

## North star

**Completed bookings paid online, per month** (and their GMV). Shown at the top of Admin → Growth.
