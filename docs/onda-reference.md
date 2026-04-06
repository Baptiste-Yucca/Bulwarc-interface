# Onda (onda.eth.pm) - Stack & Style Reference

## Tech Stack

- **Framework**: Next.js (App Router, React Server Components, Suspense)
- **Language**: TypeScript / React
- **Styling**: Tailwind CSS + custom CSS with CSS variables
- **Fonts**: Monospace (`font-mono`) for financial data, system/custom sans-serif for UI
- **Deployment**: Vercel
- **No heavy web3 library** detected in the frontend payload (likely server-side or lazy-loaded)

## Design System

### Color Palette

| Token           | Usage                        |
| --------------- | ---------------------------- |
| `--onda`        | Primary accent (blue/teal)   |
| `--ink`         | Main text                    |
| `--ink-light`   | Secondary text               |
| `--ink-faint`   | Muted / tertiary text        |
| `--paper`       | Background (light)           |
| `--paper-dark`  | Background (dark mode)       |
| `--rule`        | Borders / dividers           |

High-contrast monochromatic scheme with a single accent color. Dark mode ready.

### Typography

- **Display**: 5xl-7xl, bold, tight leading (`leading-[0.95]`)
- **Headings**: 2xl-3xl, bold
- **Body**: sm to lg
- **Financial amounts**: Monospace (`font-mono`)
- Overall feel: clean, typographic-first hierarchy

### Layout

- Centered container: `max-w-4xl mx-auto`
- Responsive padding: `px-5 sm:px-8`
- Grid: 3 columns on desktop, stacked on mobile
- Generous vertical rhythm via `py-*` spacing

### UI Components & Patterns

- **Card-based layout** with `border-rule` borders
- **Offset shadows**: `shadow-[6px_6px_0_0_rgba(...)]` (brutalist-ish, graphic feel)
- **Buttons**: `btn-primary` / `btn-secondary` variants
- **Tags / Badges** for labels
- **Step cards**: Numbered flow (01, 02, 03) with icons
- **Stats grid**: 3-column metric display with large mono numbers
- **Hero**: Large display type with intentional line breaks for emphasis

### Overall Aesthetic

- **Minimal, modern, typographic**
- Clean whitespace, strong grid alignment
- Emphasis on typography over decoration
- Warm and approachable despite the minimalism
- Brutalist shadow accents add personality without clutter
