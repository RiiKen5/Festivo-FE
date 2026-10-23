# Festivo — Project Status

_Last updated: 23 October 2026_

Festivo is an event marketplace: organizers book local vendors and sell tickets or invite guests; payments are held by Festivo and released to vendors after completion. Two repos: `Festivo-FE` (this Angular 18 app) and `Festivo-BE` (Express + MongoDB API).

## UI/UX transformation

| Item | Status |
|---|---|
| UI/UX audit | Done — `docs/ui-ux-audit.md` (critical → low issues, accessibility, responsive, direction) |
| Design system | Done — tokens, type scale, radius/elevation rules, components; documented in `docs/ui-design-system.md` |
| Global shell | Done — single navbar + footer in `app.component.ts`, skip link, `main` landmark |
| Shared components | Done — button, modal, icon, logo, empty state, event/vendor cards, image upload, auth aside, browse layout |
| Screens redesigned | Landing, sign-in/up/forgot/reset/verify, events list + detail, vendors list + detail, bookings list + detail, notifications, dashboard (icons/empty states/stats), my services (dialog), event & service forms (icons, pickers), profile (labels), earnings/admin (inherit system), legal, 404 |
| Accessibility | axe-core WCAG 2 A/AA: 0 violations on 17 pages; keyboard focus visible everywhere; dialogs and menus accessible |
| Responsive | No horizontal overflow at 390px on any route; sticky mobile actions on event/vendor detail; booking detail reordered for phones |

### What changed, in short

- **Honesty:** removed invented statistics ("10K+ events", "50K+ guests", "thousands of organizers") and features that don't exist (QR check-in, reminders). Copy now describes what the product does.
- **Brand:** colour and monogram taken from the Festivo logo (berry `#bb5782`); Inter for UI, Fraunces for the wordmark/headline; no gradients, glows or emoji icons.
- **Correctness bugs fixed while redesigning:** event cards showed the wrong start time; event/vendor counts were blank; raw template code (`{{ statusFilter() ? … }}`) appeared on Bookings; notifications never navigated anywhere and icons never matched; "load older notifications" never appeared; vendor `?category=` links were ignored; booking service link/rating fields weren't loaded; misleading "different account" error on network failures; duplicate error toasts; navbar logo collapsed to zero width; "Open in Maps" opened an empty search.
- **Accessibility fixes:** focus rings (11 places removed them), dialog semantics + focus management, keyboard-operable tile pickers and toggles, labelled selects and icon buttons, AA contrast for muted text, underlined links in body text, reduced-motion support.

### Components changed or added

Added: `icon`, `logo`, `empty-state`, `listing-cards` (event/vendor + `listing-format.ts`), `site-footer`, `auth-aside`, `shared/styles/listing-page.scss`, branded SVG placeholders, favicon.
Changed: `button` (solid variants, focus, aria-busy), `modal` (a11y, bottom sheet), `navbar` (rewritten), `input` (password toggle icon/labels), `toast.service` (de-duplication), global tokens/mixins/base.

## Tests performed (this round)

| Check | Result |
|---|---|
| Production build (`ng build`) | Passes, no warnings |
| Backend tests (`backend: npm test`, Jest) | 42/42 pass |
| Browser journeys (`backend/e2e: npm test`) — booking + payments + payouts, events + invites + tickets + check-in, accounts + uploads + passwords, secondary actions | 4/4 pass, 0 API failures, 0 console errors |
| Page crawl as anonymous/organizer/vendor/attendee/admin (`npm run crawl`) | No errors (only expected auth/role redirects) |
| Mobile overflow at 390px (`npm run mobile`) | None |
| Accessibility, axe-core WCAG 2 A/AA, 17 pages (`npm run a11y`) | 0 violations |
| Lint | Not configured in the frontend (no ESLint setup) |
| Frontend unit tests | None exist (`ng test` has no specs) |

## Known remaining issues

- **Business details** on Terms/Privacy/Contact are placeholders (`features/legal/legal.component.ts`) and the legal text needs review before Razorpay activation.
- **Large legacy page components** (event detail ~1,900 lines, service detail ~2,100 lines) still carry page-local CSS for older sections (reviews, booking modal, tasks). They follow the tokens but should be split into smaller components.
- **Some sections keep older inline SVG icons** (sidebar share buttons, review helpful/report). They match the line style but aren't yet `app-icon`.
- **Forms** still disable submit until valid instead of showing errors on submit; the event and service forms are long single pages rather than stepped.
- **Real-time:** messages poll every 8s; the backend's socket events aren't consumed yet.
- **Images:** uploads are stored in MongoDB unless S3 is configured; fine for launch, move to S3/CDN as traffic grows.
- **Dark mode** is not supported.

## Technical debt

- No ESLint/Prettier in the frontend; no frontend unit tests.
- Component style budget raised to 16 kB (warning) because of the two large detail pages — reduce by splitting them, then lower the budget again.
- `FavoriteService` stores favourites in `localStorage` only (not synced across devices).
- `CardComponent` (`shared/components/card`) is no longer used by listing pages; remove once nothing references it.

## Next recommended improvements

1. Fill in legal/business details and get Razorpay activated (test-mode run of book → pay → refund first).
2. Split event/service detail into section components; migrate remaining inline SVGs to `app-icon`.
3. Stepped event-creation flow with inline validation on blur/submit.
4. Socket.io client for instant messages and notifications.
5. Vendor-specific dashboard view (requests, upcoming jobs, earnings at a glance).
6. Add ESLint + a few component tests for the shared components; run `backend/e2e` in CI.
