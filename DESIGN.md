---
name: Myhabit
description: A calm daily workspace in cream, sage and terracotta, with complete light and dark themes.
colors:
  bg: "#F6F5F0"
  surface: "#FDFCF9"
  ink: "#303D35"
  ink-soft: "#526257"
  muted: "#606B60"
  line: "#DDE2D8"
  accent: "#A6532E"
  accent-ink: "#FDFCF9"
  accent-soft: "#F5E9E0"
  success: "#42664E"
  success-soft: "#E9EFE4"
  danger: "#A43F36"
  danger-soft: "#F5E7E3"
  warning: "#806020"
  warning-soft: "#F3EBD6"
  heat-0: "#E8E7DF"
  heat-1: "#D4DEC9"
  heat-2: "#9BAF96"
  heat-3: "#4B745B"
  heat-ink: "#23352A"
  hover: "#EFF1E9"
  control-line: "#7B887D"
  sidebar: "#ECEFE6"
  dark-bg: "#1B231F"
  dark-surface: "#252F29"
  dark-ink: "#E7EDE4"
  dark-ink-soft: "#C1CEC0"
  dark-muted: "#A4B3A3"
  dark-line: "#3E4C41"
  dark-accent: "#E1A47F"
  dark-accent-ink: "#1B231F"
  dark-accent-soft: "#3C3028"
  dark-success: "#ACC5A1"
  dark-success-soft: "#2C3A2D"
  dark-danger: "#E19B93"
  dark-danger-soft: "#412D2B"
  dark-warning: "#D2B877"
  dark-warning-soft: "#3C3525"
  dark-heat-0: "#303A32"
  dark-heat-1: "#445F4B"
  dark-heat-2: "#6F9276"
  dark-heat-3: "#A1C4A6"
  dark-heat-ink: "#1A201C"
  dark-hover: "#303D32"
  dark-control-line: "#81957F"
  dark-sidebar: "#202A23"
typography:
  display:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.5vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-.03em"
  headline:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "clamp(1.7rem, 4vw, 2.35rem)"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "-.025em"
  title:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.6
  body:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: ".875rem"
    fontWeight: 500
    lineHeight: 1.6
rounded:
  surface: "14px"
  control: "10px"
  indicator: "8px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  day-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
  surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
  sidebar-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
---

# Design System: Myhabit

## Overview

**Creative North Star: "A calm daily workspace"**

Myhabit uses warm cream, quiet sage and restrained terracotta to make daily routines easy to scan. Anuphan carries both Thai and English with the same welcoming, readable character.

Light and dark are complete versions of one shared system. Flat surfaces, fine borders and generous space establish hierarchy; color marks actions, selected states and recorded progress.

**Key Characteristics:**

- Warm cream and sage surfaces with restrained terracotta actions.
- Anuphan throughout Thai and English interfaces.
- Flat containers, clear rows and visible interaction states.
- Responsive desktop sidebar and mobile bottom navigation.

## Colors

The palette balances warm paper, sage neutrals and terracotta without competing module identities. Frontmatter keys correspond to the shared `--mh-*` variables in `app/assets/css/main.css`; `dark-*` records the matching `:root.dark` overrides.

### Primary

- **Restrained Terracotta** (`accent` / `dark-accent`): primary actions, selected dates, active navigation and the Myhabit wordmark accent.
- **Terracotta Wash** (`accent-soft` / `dark-accent-soft`): notices, selected quiet controls and the featured bill-splitting tool.
- **Action Foreground** (`accent-ink` / `dark-accent-ink`): explicit readable foreground for solid action fills.

### Secondary

- **Sage Success** (`success` / `dark-success`): completed habits and successful status.
- **Sage Wash** (`success-soft` / `dark-success-soft`): daily overview, welcome plan and completed habit rows.
- **Recorded Activity** (`heat-0` through `heat-3`, with dark counterparts): the progress calendar and annual heatmap. Preserve their existing thresholds and the dedicated heatmap foreground.
- **Error and Caution** (`danger`, `warning` and their soft/dark counterparts): semantic feedback, never decoration.

### Neutral

- **Warm Paper / Forest Ground** (`bg` / `dark-bg`): page canvas.
- **Cream Surface / Forest Surface** (`surface` / `dark-surface`): forms, grouped rows and header.
- **Sage Rail** (`sidebar` / `dark-sidebar`): desktop navigation.
- **Primary Ink**, **Soft Ink** and **Muted Ink** (`ink`, `ink-soft`, `muted`, with dark counterparts): content, secondary content and help text.
- **Fine Divider** and **Control Edge** (`line`, `control-line`, with dark counterparts): resting separators and stronger interactive boundaries.
- **Quiet Hover** (`hover` / `dark-hover`): row and secondary-control hover.

**The Shared Theme Rule.** Every module uses the global system, light or dark preference and the same semantic color roles.

## Typography

**Display Font:** Anuphan, with system-ui and sans-serif fallbacks.  
**Body Font:** Anuphan, with the same fallbacks.  
**Label/Mono Font:** Anuphan; numeric counters use tabular figures rather than a separate monospace family.

### Hierarchy

- **Display:** the welcome headline; compact line height allows a deliberate two-line introduction.
- **Headline:** page titles with balanced wrapping; small-phone override is (1.9rem).
- **Title:** section headings; agenda headings may use (1.25rem).
- **Body:** routine names and primary explanatory content. Welcome supporting text uses (1.125rem), line height (1.9) and a maximum width of (48ch).
- **Label:** forms and secondary section labels. Help text uses (.875rem) and line height (1.7).
- Keep Thai/English case natural; small eyebrows are not forced uppercase.

## Layout

The application has a sticky header (76px minimum height), with a compact phone header (68px) below (480px). The shared page container is capped at (1160px). Below desktop it uses (20px) horizontal margins, reduced to (16px) on small phones, and reserves bottom space for navigation.

At (1024px) and above, a fixed sidebar (236px wide) sits below the header and the main region offsets by the same width. The container then uses (40px) horizontal margins and (40px / 64px) vertical padding. Below this breakpoint, the bottom navigation provides the primary routes and Tools opens further modules.

Today stacks overview and agenda until (1200px), then uses a (320px) overview beside a flexible agenda with a (36px) gap. The overview stays visible with a sticky top offset (108px). Progress uses a flexible calendar beside a (300px) annual overview at the same breakpoint. Tools uses divided two-column rows, collapsing below (650px). Welcome becomes two columns at (800px). Focus retains a centered, width-limited timer and lets its clock shrink on narrow phones.

Use the shared spacing scale for rhythm. Rows and grids need `min-width: 0` and wrapping so real Thai/English content fits.

Finance records stack below (640px): category and date span the full copy row above the amount and edit/remove actions. Keep metadata readable without squeezing it beside the amount.

## Elevation & Depth

Shared surfaces use no shadow. Page canvas, surface and sidebar tones establish layers; fine borders and section spacing establish grouping. Feedback colors belong to state and meaningful summaries.

**The Flat Surface Rule.** Use borders, space and tonal layering to distinguish regions; shared surfaces have no shadow.

## Shapes

Surfaces have gently curved corners (`surface`); controls use tighter corners (`control`). Habit completion indicators use compact rounded squares (`indicator`), while the real habit and focus counters retain circular geometry. Borders are thin (1px); avoid nesting decorative containers around each individual row.

## Components

### Buttons

Refined and restrained. Primary buttons use terracotta with the dedicated action foreground; quiet buttons use a surface fill, soft ink and fine border. Both have a minimum height (44px), medium-heavy type (600), and shared control timing (`--motion-fast`, 140ms). Fine-pointer hover brightens the primary fill; quiet hover uses the hover tone and stronger control edge. Active controls move down (1px). Disabled buttons lower opacity (.55) and show an unavailable cursor.

### Chips

Day chips use a surface fill and control radius, with selected terracotta text on a wash. Today's seven-date strip is a separate, compact calendar pattern: selected dates use solid terracotta with action foreground, and buttons remain (58px) tall. Preserve their distinct selected states.

### Cards / Containers

Surface containers group related records with a thin divider and the shared radius. Padding follows the local content density, commonly (20px) or (28px). Welcome and Today summaries use sage wash; routine groups use ordinary surfaces with divided rows.

### Inputs / Fields

Fields use a surface background, primary ink, stronger control border and minimum height (44px). Hover strengthens the edge. Focus shifts the border to terracotta and adds a soft terracotta outline; the global keyboard focus remains visible. Placeholders use muted ink.

### Navigation

Desktop route rows are (48px) minimum height, use soft ink at rest, and hover on a quiet tonal fill. Active routes use a surface fill, terracotta text and weight (600). Bottom route links are (52px) minimum height. A visible-on-focus skip link precedes the header; icon-only theme controls have descriptive labels.

### Habit Rows and Progress

Habit rows present completion, name, description and time in a clear line. Desktop rows are (86px) minimum height with generous padding; phone rows reduce spacing. Completed rows use sage wash and a filled sage completion indicator. Hover uses the quiet tone, and focusing the underlying checkbox outlines its row.

The habit ring, pass threshold and streak reflect the habit domain. Tasks and optional check-ins use their own completion records. The focus clock reflects timer progress; the calendar and heatmap reflect habit activity. Never substitute illustrative data for these states.

### Tool Rows

Tool discovery uses divided text rows with icons and concise descriptions. Bill splitting receives a terracotta wash across the full row; converters remain quieter. Tools remain available on demand rather than compulsory daily work.

### Shared Interaction and Motion

The shared motion tokens in `app/assets/css/main.css` are `--motion-fast: 140ms`, `--motion-state: 220ms`, and `--ease-out: cubic-bezier(.16,1,.3,1)`. Motion extends the same calm identity across both themes. Controls transition color, background, border, opacity and transform using fast timing; record rows and completion indicators use state timing.

Fine-pointer hover (`hover: hover` and `pointer: fine`) gives quiet tonal feedback, preserves selected washes, and moves a trailing navigation icon (2px) toward its destination. Keyboard focus remains a visible terracotta outline (2px, offset 3px). Pressed controls move (1px) without layout changes.

Habit checks confirm over (220ms); conversion results settle over (220ms). Progress rings and fills update over (300ms). Workspace entry uses (160ms) with a (4px) settling movement; exit uses (100ms). A (900ms) linear spinner runs only while a request is loading. Do not add perpetual decorative movement.

Reduced-motion preferences reduce transition and animation duration to (.01ms), limit animation iteration to one, remove pressed and hover movement, and keep workspace entry/exit still and fully opaque.

### Notifications

Success feedback appears at top center. Keep one current notification; a newer action replaces the previous one. Reversible changes expose a readable Undo action with a minimum height (44px). Feedback belongs to the active owner and clears when that owner changes.

## Do's and Don'ts

### Do:

- **Do** use shared semantic CSS variables in both themes.
- **Do** keep habit progress distinct from tasks, goals, focus and mood.
- **Do** retain visible focus, descriptive labels and reduced-motion support.
- **Do** keep Thai and English copy readable when content wraps.

### Don't:

- **Don't** add module-specific themes.
- **Don't** replace real habit counts or streaks with decorative progress.
- **Don't** use excessive shadows, motion or decorative color blocks.

