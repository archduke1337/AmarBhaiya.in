# Project Brief

## Design Intent

The marketing site is an "Ethereal Glass + Editorial Luxury" hybrid: a deep, warm, OLED-dark aesthetic with a saffron/amber accent and cinematic typography (DM Serif Display + Plus Jakarta Sans). It should feel **calm, structured, and trustworthy** for students and parents — deliberately NOT loud marketing. The dashboards inherit the same system but lean cleaner and denser.

Two aesthetic registers run side by side:
- **Site (editorial luxury)**: `RetroPanel` panels, hard-offset `shadow-retro`, `card-bezel` bento, `SectionHeading` heroes, bilingual (Hinglish) headlines.
- **Dashboards (clean utility)**: softer `surface-shadow`, compact tables, tight DNI, same tokens/type scale.

## Audience

- **Primary**: Indian school students in Classes 6–12 (aged ~11–18), often on **mobile phones** (Android + iOS), frequently Hindi-medium or bilingual. Low patience for friction; needs clarity, not decoration.
- **Secondary**: Parents/guardians (safety, billing, accountability) and serious learners/professionals (skill tracks).
- Across the board they prioritize: notes-first quick clarity, low-cost/honest pricing, verified certificates, and trustworthy payment/cancellation behavior.

## Voice and Tone

Warm, direct, and honest — often lightly Hinglish on the marketing site ("Padhai simple, honest aur useful."), but clear and professional on dashboards and in legal/policy pages. Avoid marketing fluff; errors and empty states explain the cause and give a next step. Trust-building copy ("trust first, then enrollment") is a recurring motif.

## Constraints

- **Mobile-first.** 44px minimum touch targets, iOS/Android safe areas (`pt-safe`/`pb-safe`, `pb-tab` for the bottom tab bar), `min-h-dvh`, no layout overflow on 320px screens.
- **Accessibility**: respect `prefers-reduced-motion` (never leave `.reveal` content hidden), `:focus-visible` rings everywhere, semantic `role="alert"`/`role="status"` feedback, keyboard-trap + Escape handling in overlays.
- **Dark mode is first-class.** Every token has a `.dark` variant; hardcoding a light-only hex is a bug. Use the established `text-*-600 dark:text-*-400` pattern for status colors.
- **Design-system discipline.** Use the shared primitives (`Input`, `PasswordInput`, `Button`, `Badge`, `RetroPanel`, `SectionHeading`, `RevealWrapper`) instead of ad-hoc styling. New UI must match existing tokens (see tokens.md) and follow an existing `patterns.md` pattern where one fits.
- **Does not trust the client.** Pricing is read from the DB server-side; payments verify signatures; redirect params are sanitized.