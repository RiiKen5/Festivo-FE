# Festivo UI/UX Audit

Date: 23 October 2026 · Scope: Angular 18 web app (`frontend/`), all routes, desktop (1440px) and mobile (390px), logged out and as organizer, vendor, attendee and admin.

Method: every route was captured with Playwright against a seeded local stack (screens in the audit run, not committed), and the source was read for each shared component and page. Counts below come from the source.

## Current state

**Architecture.** Angular 18 standalone components, lazy-loaded feature routes, signals for local state, services over a thin `ApiService`. Styling is SCSS: tokens in `src/styles/_variables.scss`, mixins in `_mixins.scss`, a reset and globals in `_base.scss`/`styles.scss`, then large inline `styles: []` blocks per component (several pages are 1,000–2,000 lines, mostly CSS). Shared components: button, card, input, modal, navbar, toast, skeleton, loading/error state, image upload. No component library, no icon library.

**Visual language today.** A purple (`#7c3aed`) to orange (`#f97316`) gradient brand, Poppins headings with Inter body, gradient-filled buttons with a coloured glow that lift on hover, 16px-radius white cards, emoji used as icons, a stock photo placeholder for every event and a stock "SERVICE" clip-art photo for every vendor.

**The brand mark disagrees with the UI.** The logo in `assets/images/logo.svg` is an elegant berry/rose (`#bb5782`) serif "F" monogram with a script wordmark and the line "Designed by people. Organised by community". None of the UI uses that colour or tone. The logo file is also a 240 KB full lockup with a white background and no intrinsic size, so it collapses to zero width in the navbar (the navbar currently shows no logo at all).

**What is already good and should be kept.** Inter for body text, a reasonable spacing scale, a full neutral scale, signals-based components, lazy routes, consistent page container widths on most pages, the booking detail information structure, the earnings and admin pages' plain layouts, the guest list and invite tooling on event detail.

## Problems

### Critical

1. **Invented business claims.** The landing hero and the login/register side panels show "10K+ Events Created · 50K+ Happy Guests · 1K+ Verified Vendors" and "Join thousands of organizers". The CTA says "Join thousands of organizers making memories". Feature cards promise "QR codes" and "reminders" that don't exist. For a new marketplace this is misleading and a trust/legal risk.
2. **Raw template code shown to users.** Bookings empty state renders `{{ statusFilter() ? 'No bookings with this status' : 'You don't have any bookings yet' }}` literally.
3. **Wrong event times.** Event cards on the list and home page format the time portion of the date timestamp ("10:12 am") instead of the event's `time` field ("19:00"). Every attendee sees the wrong start time.
4. **No visible keyboard focus.** 11 rules set `outline: none`, zero `:focus-visible` replacements. Buttons, links and custom controls are unusable by keyboard.
5. **Logo missing from the navbar** (see above). The product has no visible identity on any page except auth/footer emoji wordmarks.

### High

6. **Template look.** 30 gradients, 9 glowing/lifting effects, purple→orange hero bands on the landing, events and services pages, emoji feature icons, floating "chip" decorations. Reads as a generic template, not a trustworthy payments marketplace.
7. **Global heading scale is wrong for an app.** `h1` grows to 60px and `h2` to 36px globally, so in-app titles ("Admin", "Earnings & Payouts", "Quick Actions", "Contact Vendor", vendor names) are poster-sized. Components fight this with local overrides, producing ~10 different heading sizes.
8. **Misleading placeholder imagery.** Every event without a cover shows the same wedding-table stock photo; every vendor shows a stock "SERVICE" clip-art image. Users can't tell listings apart and the clip-art looks unprofessional next to real vendors.
9. **Primary actions are buried on mobile.** On event, service and booking detail the primary action lives in the sidebar, which stacks to the very bottom on phones (Buy Ticket, Book Now, Pay, Confirm & Send Quote).
10. **Low-contrast text on imagery/gradients.** Login/register hero heading is near-black on a saturated purple/orange gradient. Several white-on-gradient labels fall below WCAG AA.
11. **Results count missing.** Events list says "events found" with no number.
12. **Raw enum labels.** `HOUSE_PARTY`, `food`, `house_party` appear on cards and detail pages.

### Medium

13. **Inconsistent buttons.** Primary = gradient + glow; secondary = 2px purple outline; ghost; danger/success gradients; plus page-local `.btn-*`, `.tab-btn`, `.share-btn`, `.respond-btn` and raw `<button>`s with their own styles. Disabled primary is a washed-out lilac that looks like a hover state.
14. **Inconsistent radii and elevation.** Cards at 16px, modals at 24px, inputs at 8px, pills at full; `shadow-sm` on most cards but `shadow-md/lg` and coloured shadows elsewhere.
15. **Emoji as icons** (108 occurrences in 21 files) mixed with Feather-style inline SVGs. Emoji render differently per OS, can't be coloured, and are announced oddly by screen readers.
16. **Grammar/plurals.** "1 bookings completed", "(1 reviews)", "Based on 1 reviews", "1 people".
17. **Dense card stacks.** Service detail splits short content into 6 separate cards (About, Service Areas, Tags, About the Vendor, Reviews…) each with its own divider heading.
18. **Admin shown as "PRO"** in the navbar role badge.
19. **"Top-rated vendors" home section renders empty** when no vendor has ratings.
20. **Copyright year hard-coded to 2024.**

### Low

21. Two display fonts (Poppins + Inter) for no clear reason; Poppins 800 adds weight to the page load.
22. Toasts slide in from the right with a 100% translate; no reduced-motion handling.
23. Component style budgets exceeded on event/service detail (CSS bloat).
24. Footer only exists on the home page.

## Design inconsistencies (summary)

| Area | Variations found |
|---|---|
| Buttons | 5 shared variants + ≥6 page-local button styles; gradients on 3 variants |
| Radius | 6 radius tokens in use (4–24px) without a rule for which applies where |
| Headings | 10 font-size tokens used for headings; global h1–h4 too large for app screens |
| Colour | Brand purple, orange secondary, teal accent and logo berry all present; 18 hard-coded hex values |
| Icons | Emoji + inline SVG (Feather-like) + unicode glyphs (✓ ✕ ★) |
| Cards | `.card` mixin, `app-card`, and per-page card styles with different padding/borders |
| Empty states | Emoji + title + text, sizes vary per page; some have actions, some don't |

## UX problems

- Primary action placement on mobile (above).
- Booking detail on mobile: the service mini-card squeezes its title to three lines next to a wrapped "View Service" button.
- Event list filters use a long sidebar that pushes results below the fold on tablets.
- Destructive actions are inconsistent: event cancel uses a modal (good), booking cancel uses a modal, task delete and listing delete differ in style.
- Toasts duplicate: the error interceptor toasts and many components toast again for the same failure.
- Errors elsewhere are mostly good after the recent interceptor fix (server messages are surfaced).

## Responsive problems

- No horizontal overflow on any route at 390px (checked automatically).
- Navbar on mobile shows only the CTA and a hamburger (logo missing).
- Hero bands take 50–60% of the first mobile viewport on events/services pages before any content.
- Sidebar-first content order on detail pages (primary action at the bottom).
- Tables (earnings, admin) scroll horizontally inside their card — acceptable, keep.

## Accessibility problems

- No `:focus-visible` styles; outlines removed.
- `app-modal` has no `role="dialog"`, `aria-modal`, `aria-labelledby`, or initial focus.
- 9 of 15 `<img>` tags have no `alt`.
- 8 clickable `<div>`s (not keyboard reachable).
- Emoji icons are read aloud ("clipboard", "hammer and wrench").
- Contrast failures on gradient heroes and the disabled primary button.
- Only 1 `aria-*` attribute in the codebase.
- No `prefers-reduced-motion` handling.

## Would a funded product ship this?

Not yet. The flows work, but the invented statistics, the template gradients, wrong times on cards, placeholder clip-art, and the missing logo would make a careful user hesitate before paying a stranger through it. Trust is the product here.

## Recommended direction

**"Warm, trustworthy marketplace" built on the existing brand mark.**

- **Colour.** Adopt the logo's berry (`#bb5782`) as the brand hue, tuned into an accessible scale (buttons use the darker `#9e3f68` so white text passes AA). Neutrals stay cool gray. Orange/teal leave the UI chrome; semantic colours remain for status only. No gradients in UI chrome.
- **Type.** Inter for everything in the app, with a tight, explicit scale (page title 28px, section 20px, card title 16px). One serif display face (Fraunces) only for the wordmark and the landing hero headline, echoing the logo's serif monogram.
- **Surfaces.** White cards on a light gray canvas, 1px borders instead of heavy shadows, one radius rule (8px controls, 12px cards, 16px dialogs, full for pills/avatars), shadows only for overlays.
- **Buttons.** Solid primary, white-with-border secondary, quiet ghost, solid danger. No glow, no lift. Visible focus ring everywhere.
- **Icons.** One line-icon set (Feather/Lucide style, 1.75px stroke) via a shared `app-icon`; no emoji in UI chrome.
- **Imagery.** Real covers where provided; otherwise a neutral branded placeholder with the event-type/category icon — never a misleading stock photo.
- **Honest copy.** Describe what Festivo actually does (book vendors, pay safely, sell tickets, invite guests). No unverifiable numbers.
- **Mobile.** Primary action first on detail pages (sticky bottom bar on phones), compact page headers instead of hero bands.

## Implementation order

25. Tokens + global base (colour, type scale, focus, reduced motion), new logo mark, navbar, footer.
26. Shared components: button, input, card, modal (a11y), badges, empty state, icon, placeholder imagery.
27. Screens: landing → auth → events list/detail → services list/detail → bookings → dashboard → messages/notifications/profile → create forms → earnings/admin → legal/404.
28. Responsive pass (sticky mobile actions), accessibility pass, copy pass.
29. Regression: e2e journeys, crawl, mobile overflow, production build, backend tests.
