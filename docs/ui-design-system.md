# Festivo Design System

How the web app looks and behaves, and the rules for adding to it. Tokens live in `src/styles/_variables.scss`, mixins in `src/styles/_mixins.scss`, global rules in `src/styles/_base.scss`. Background and decisions: `docs/ui-ux-audit.md`.

## Principles

1. **Trust first.** Festivo moves people's money. Every claim is true, every amount is explicit, nothing decorative competes with prices, statuses and next steps.
2. **One obvious next step.** Each screen has one filled primary button. Everything else is secondary (outlined) or ghost.
3. **Quiet surfaces, strong content.** White cards with 1px borders on a light gray canvas. Colour is for meaning (brand actions, status), not decoration.
4. **Built from the brand mark.** The berry colour and serif monogram come from the Festivo logo.
5. **Works for everyone.** Visible keyboard focus, labelled controls, AA contrast, reduced motion respected, mobile first.

## Colour

| Token | Value | Use |
|---|---|---|
| `$primary-600` | `#9e3f68` | Primary buttons, active states, links (`$text-link`) |
| `$primary-700` / `800` | `#843455` / `#6b2b46` | Hover / pressed |
| `$primary-500` | `#bb5782` | Logo colour, focus ring tint. Not for text on white (fails AA) |
| `$primary-50` / `100` | `#fbf4f7` / `#f6e7ee` | Selected chips, unread rows, icon circles |
| `$bg-secondary` | `#fafafa` | Page canvas |
| `$bg-primary` | `#ffffff` | Cards, navbar, inputs |
| `$border-light` / `default` | `#e4e4e7` / `#d4d4d8` | Card borders / input borders |
| `$text-primary` | `#18181b` | Body and headings |
| `$text-secondary` | `#52525b` | Supporting text |
| `$text-tertiary`, `$text-muted` | `#71717a` | Meta text, placeholders (4.8:1, passes AA) |
| `$success-*`, `$warning-*`, `$error-*`, `$info-*` | Tailwind-like scales | Status only |

Rules: no gradients in UI chrome (the legacy `$bg-gradient-*` names resolve to solid colours). Orange/teal scales are illustration-only. Never put white text on `$primary-500` or lighter.

## Typography

- **Inter** for all UI text. **Fraunces** (600) only for the wordmark, the landing headline and the auth side panel. Both load from `index.html`.
- Scale (mixins): `display` 40→56px (marketing headline) · `heading-1` 24→28px page title · `heading-2` 20px section · `heading-3` 18px card title · `heading-4` 16px · body 16px · small 14px · caption 12px.
- Page titles use `h1` inside `.page-header` (title + `.page-header__subtitle` + one primary action on the right).
- Sentence case for headings, buttons and badges ("Create event", not "Create Event"). Badges are not uppercased.

## Spacing, radius, elevation

- Spacing: 4px base (`$spacing-1` … `$spacing-24`). Card padding 24px (`$card-padding`), page top padding 32px.
- Radius: controls 8px (`$radius-default`), cards 12px (`$radius-lg`), dialogs/sheets 16px (`$radius-xl`), pills/avatars `$radius-full`.
- Elevation: cards use a border plus `$shadow-xs`; hover raises to `$shadow-default`. `$shadow-md` is for dropdowns/popovers, `$shadow-lg` for dialogs. No coloured shadows, no hover "lift" transforms.

## Breakpoints

`xs 480 · sm 640 · md 768 · lg 1024 · xl 1280` with `@include sm/md/lg` (min-width) and `max-sm/max-md` (max-width) mixins. Container: `@include container` (1280px max, 16/24/32px gutters).

## Components

| Component | Where | Notes |
|---|---|---|
| `app-button` | `shared/components/button` | `variant`: primary · secondary · ghost · danger · success; `size`: sm (36px) · md (40px) · lg (48px); `fullWidth`; `loading` sets `aria-busy` |
| `app-icon` | `shared/components/icon` | The only icon source. Lucide geometry, 1.75 stroke, `aria-hidden`. Add new icons to the `ICONS` map. Maps for event types / categories exported alongside |
| `app-logo` | `shared/components/logo` | Monogram + wordmark; `inverse` for dark backgrounds. The full lockup (`assets/images/logo.svg`) is for print/social, not UI |
| `app-modal` | `shared/components/modal` | `role="dialog"`, labelled by its title, focus moves in and returns, Tab is trapped, Escape closes; bottom sheet under 640px. Use for every dialog |
| `app-empty-state` | `shared/components/empty-state` | Icon + title + one-line explanation + next action (projected). Never "No data found" |
| `app-event-card`, `app-vendor-card` | `shared/components/listing-cards` | The only cards for events/vendors. Show real start time, plural-aware counts, "New on Festivo" instead of 0.0 ratings |
| `app-image-upload` | `shared/components/image-upload` | Upload button that emits URLs |
| `app-navbar`, `app-site-footer` | app shell (`app.component.ts`) | Rendered once for all non-auth routes; pages must not include their own |
| `app-auth-aside` | auth pages | Brand panel for sign-in/sign-up |
| Browse layout | `shared/styles/listing-page.scss` | Toolbar fields, filter chips, segmented controls, result grid, pagination |
| Global classes | `_base.scss` | `.form-input/.form-select/.form-textarea`, `.page-header`, `.visually-hidden`, `.skip-link`, `.skeleton*`, `.badge*` |

Display helpers (`listing-format.ts`): `eventTypeLabel`, `categoryLabel`, `priceUnitLabel`, `formatTime` ("19:00" → "7:00 pm"), `formatShortDate`, `plural`. Never show raw enum values (`house_party`) or `"1 reviews"`.

## Responsive rules

- Design at 390px first. No horizontal page scroll (checked by `backend/e2e/mobile.js`).
- Filters become horizontally scrolling chips under `md`; sidebars stack.
- Detail pages put the primary action in a fixed bottom bar under `lg` (`.mobile-cta`), and add bottom padding so content isn't hidden.
- Booking detail reorders on phones: summary → next steps → details → contact → event.
- Dialogs become bottom sheets under `sm`. Touch targets ≥ 40px (navbar icons, chips 36px with spacing).

## Accessibility rules

- Never remove focus without a replacement: use `@include focus-ring` (or rely on the global `:focus-visible` outline).
- Custom radios/checkboxes stay in the DOM with `@include visually-hidden`; style the wrapper with `:has(input:focus-visible)`.
- Every input/select has a `<label for>` or wrapping label; icon-only buttons have `aria-label`.
- Interactive things are `<button>`/`<a>`, not clickable `div`s. Menus use `aria-expanded`; toggle groups use `aria-pressed`; live counts use `aria-live="polite"`.
- Text colours must pass WCAG AA (≥ 4.5:1). `backend/e2e/a11y.js` runs axe-core (WCAG 2 A/AA) on 17 pages and must report no violations.
- Animations are short (≤ 200ms) and disabled under `prefers-reduced-motion`.

## Interaction conventions

- Hover: border/background shift only. Press: one shade darker. Disabled: 45% opacity, `not-allowed`.
- Loading: skeletons for lists/cards; button `loading` for actions; no full-page spinners.
- Errors: the HTTP interceptor surfaces the server's message once (toasts are de-duplicated). Pages distinguish "not found / not yours" from "couldn't load, try again".
- Destructive actions confirm in `app-modal` with specific consequences ("refunded according to the cancellation policy") and a danger button whose label repeats the action.
- Copy: product language, sentence case, no invented numbers or claims.
