# Elseview Design System

Extracted from the landing page after removing all app pages, auth flows, tester/workspace shells, and locale infrastructure. This document is the single source of truth for colors, typography, spacing, radii, shadows, surfaces, motion, and component conventions used in the remaining frontend.

---

## 1. Color Palette

All semantic colors are defined as CSS custom properties in `src/globals.css` and mapped to Tailwind tokens in `tailwind.config.ts`.

### Brand & Signal

| Token | Value | Usage |
|---|---|---|
| `--color-signal-blue` | `#0a84ff` | Primary CTA, focus rings, interactive accents |
| `--color-deep-dusk` | `#001b45` | Dark backgrounds, hero overlays |
| `--color-azure-crest` | `#0066cc` | Secondary blue accent |
| `--color-hover-glow` | `#9bd0ff` | Hover states on blue elements |
| `--color-neon` | `#30d158` | Success indicator, live status dot |
| `--color-cyan-veil` | `#64d2ff` | Light cyan accent |

### Neutrals

| Token | Value | Usage |
|---|---|---|
| `--color-ink-black` | `#000000` | Pure black |
| `--color-carbon` | `#1d1d1f` | Primary text, dark buttons |
| `--color-slate` | `#34343a` | Secondary text |
| `--color-steel` | `#6e6e73` | Tertiary text, disabled |
| `--color-fog` | `#8e8e93` | Placeholder text |
| `--color-mist` | `#aeaeb2` | Borders, dividers |
| `--color-vapor` | `#f2f2f7` | Light background layers |
| `--color-frost` | `#f5f9ff` | Tinted hover/focus backgrounds |
| `--color-chalk` | `#ffffff` | Canvas, white surfaces |
| `--color-bone` | `rgba(60,60,67,0.14)` | Subtle borders |
| `--color-ash` | `rgba(60,60,67,0.22)` | Medium borders |

### HSL Semantic Tokens (shadcn/ui)

| Token | Value | Purpose |
|---|---|---|
| `--background` | `0 0% 100%` | Page background |
| `--foreground` | `240 3% 12%` | Default text |
| `--primary` | `210 100% 52%` | Primary buttons/links |
| `--secondary` | `240 24% 96%` | Secondary surfaces |
| `--muted` | `213 100% 98%` | Muted backgrounds |
| `--accent` | `213 100% 98%` | Accent highlights |
| `--destructive` | `3 100% 59%` | Error/destructive actions |
| `--border` | `240 6% 87%` | Default borders |
| `--ring` | `210 100% 52%` | Focus ring color |

---

## 2. Typography

### Font Families

| Role | Variable | Stack |
|---|---|---|
| Headings | `--font-heading` | `"Sk-Modernist", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif` |
| Body | `--font-body` | `"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif` |
| Monospace | `--font-ui-monospace` | `"SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, monospace` |

Custom font: **Sk-Modernist Bold** (`/fonts/Sk-Modernist-Bold.otf`, weight 700, swap display).

### Type Scale

| Level | Size | Line Height | Tracking | Weight |
|---|---|---|---|---|
| Caption | 11px | 1.35 | — | 400 |
| Body | 17px | 1.47 | -0.022em | 400 |
| Subheading | 21px | 1.28 | -0.025em | 500 |
| Heading SM | 28px | 1.18 | -0.035em | 600 |
| Heading | 40px | 1.1 | -0.04em | 700 |
| Heading LG | 56px | 1.04 | -0.045em | 700 |
| Display | 88px | 0.98 | -0.055em | 700 |

Body default letter-spacing: `-0.015em`. All headings use `font-synthesis: none`.

---

## 3. Spacing

Custom spacing tokens (CSS variables):

| Token | Value |
|---|---|
| `--spacing-4` – `--spacing-20` | 4px increments |
| `--spacing-28` | 28px |
| `--spacing-32` | 32px |
| `--spacing-40` | 40px |
| `--spacing-73` | 73px |

Layout constants:

| Token | Value | Usage |
|---|---|---|
| `--page-max-width` | 1200px | Max content width |
| `--section-gap` | 72px | Vertical section spacing |
| `--card-padding` | 24px | Card internal padding |
| `--element-gap` | 8px | Gap between inline elements |

Tailwind container: centered, `1.25rem` padding, `2xl` breakpoint at `1200px`.

---

## 4. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 2px | Minimal rounding |
| `--radius-md` | 12px | Inputs, small cards |
| `--radius-lg` | 16px | Standard cards |
| `--radius-xl` | 20px | Large cards |
| `--radius-2xl` | 24px | Dialogs |
| `--radius-3xl` | 30px | Feature cards |
| `--radius-full` | 9999px | Pills, circular buttons |
| `--radius-cards` | 22px | Default card radius |
| `--radius-inputs` | 14px | Form inputs |
| `--radius-buttons` | 9999px | Pill buttons |
| `--radius-feature-cards` | 30px | Hero/feature cards |
| `--radius-product-mockup` | 26px | Product screenshots |

---

## 5. Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-subtle` | `inset 0 1px 0 rgba(255,255,255,.5), 0 8px 24px rgba(0,75,180,.22)` | Glass panels, light cards |
| `--shadow-subtle-2` | `inset 0 1px 0 rgba(255,255,255,.28), 0 24px 70px rgba(0,25,80,.28)` | Elevated glass, dark cards |
| `--shadow-lg` | `inset 0 1px 0 rgba(255,255,255,.12), inset 0 0 24px rgba(255,255,255,.03)` | Inner glow, dark surfaces |
| `--shadow-lg-2` | `inset 0 1px 0 rgba(255,255,255,.8), 0 20px 50px rgba(45,80,130,.14)` | Highlight cards |

Tailwind mappings: `subtle`, `frame` (subtle-2), `inset` (lg), `highlight` (lg-2).

---

## 6. Surface System

| Token | Value | Usage |
|---|---|---|
| `--surface-canvas` | `#ffffff` | Page background |
| `--surface-frost-tint` | `#f5f9ff` | Tinted hover/focus areas |
| `--surface-vapor-layer` | `#f2f2f7` | Secondary background layers |
| `--surface-bone-border` | `rgba(60,60,67,0.14)` | Subtle borders on white |

---

## 7. Liquid Glass Material

Two reusable CSS classes for frosted-glass surfaces:

### `.liquid-glass` (light)
```css
background: linear-gradient(145deg, rgba(255,255,255,.66), rgba(255,255,255,.32));
border: 1px solid rgba(255,255,255,.58);
box-shadow: inset 0 1px 0 rgba(255,255,255,.88), 0 18px 55px rgba(30,70,130,.12);
backdrop-filter: blur(28px) saturate(180%);
```

### `.liquid-glass-dark`
```css
background: linear-gradient(145deg, rgba(255,255,255,.16), rgba(255,255,255,.06));
border: 1px solid rgba(255,255,255,.22);
box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 24px 70px rgba(0,23,70,.24);
backdrop-filter: blur(30px) saturate(170%);
```

---

## 8. Motion & Animation

### Easing
- Hero entrance: `[0.22, 1, 0.36, 1]` (custom cubic-bezier)
- Accordion: `ease-out`, 0.2s
- Card brand-in: `cubic-bezier(.22,1,.36,1)`, 0.28s
- Scroll transitions: `power1.out`, `power3.out`, `expo.out` (GSAP)

### Keyframes
- `marquee`: horizontal infinite scroll for logo carousel
- `accordion-down/up`: Radix accordion expand/collapse
- `card-brand-in`: fade + translate + scale entrance for brand cards

### Reduced Motion
All animations respect `prefers-reduced-motion: reduce`. GSAP timelines check `window.matchMedia` and disable transform offsets when reduced motion is active.

### Smooth Scroll
Lenis with `lerp: 0.085`, `autoRaf: true`, anchor support enabled.

---

## 9. Layout Utilities

### `.bluecrest-container`
Centered max-width container with fluid side padding:
```css
width: min(calc(100% - 40px), var(--page-max-width));
margin-inline: auto;
```

### `.bluecrest-focus`
Consistent focus-visible ring for keyboard navigation:
```css
@apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:ring-offset-2;
```

### Logo Marquee Fade Edges
`.logo-marquee::before` and `::after` create gradient fade masks on left/right edges using `clamp(72px, 14vw, 200px)` width.

---

## 10. Component Conventions

### Buttons
- **Primary**: `rounded-full bg-[#07172f] text-white`, pill shape, 13px semibold
- **CTA (hero)**: `rounded-full bg-[#07172f] px-5 min-h-11`, white text
- **Link-style**: border-bottom underline, `text-carbon`, hover turns `signal-blue`
- All interactive elements use `.bluecrest-focus` for consistent focus rings

### Cards
- Default radius: `--radius-cards` (22px)
- Border: `[#07172f]/10`
- Hover: `-translate-y-1`, border shifts to `[#0a84ff]/35`, shadow `0 18px 45px rgba(7,23,47,0.08)`

### Section Spacing
- Standard vertical padding: `py-24 sm:py-28 lg:py-36`
- FAQ/story sections use sticky stacking with `z-index: index + 10`

### Selection Color
```css
::selection { background: rgba(10, 132, 255, 0.22); }
```

---

## 11. File Map

| File | Contents |
|---|---|
| `src/globals.css` | CSS variables, font-face, keyframes, utility classes, liquid glass |
| `tailwind.config.ts` | Tailwind token mapping, container config, plugins |
| `src/components/ui/minimalist-hero.tsx` | Hero layout, GSAP entrance animation |
| `src/components/MediterraMinimalistHero.tsx` | Landing hero content wrapper |
| `src/components/MediterraHeader.tsx` | Sticky header with scroll-aware styling |
| `src/components/MediterraFooter.tsx` | Footer with newsletter demo form |
| `src/components/MediterraFaq.tsx` | FAQ accordion with GSAP scroll reveal |
| `src/components/LogoCarousel.tsx` | Dual-row marquee logo strip |
| `src/components/ui/smooth-scroll.tsx` | Lenis-powered story panels |
| `src/components/ui/marquee-01.tsx` | Testimonial card marquee |
| `components.json` | shadcn/ui component configuration |

---

*Generated from the cleaned landing-page-only codebase. All app-specific tokens (sidebar, workspace overrides, auth locale) have been removed.*