# Myhabit
<!-- impeccable:product-schema 1 -->
## Platform
web
## Users
People managing daily routines, personal tasks and optional life check-ins. Thai and English interfaces, phone and desktop use.
## Product Purpose
One daily workspace combining Myhabit, Sprout, bill splitting and useful converters. Daily habit progress remains distinct from tasks, goals, focus and mood.
## Capabilities and Constraints
Nuxt 4, Nuxt UI, Tailwind, Vite and Supabase on the pinned 2026 stack. Guest IndexedDB and per-account namespaces. Users choose daily modules, global defaults, module overrides and date-specific changes. History and money must survive upgrades. Reminders work while the app is open. Daily ECB currency rates are fetched via Frankfurter; production installation/offline navigation caches only app assets and an anonymous shell. Running and paused focus clocks persist per owner. Existing modules support editing, archive/restore and Undo where applicable. No production Supabase credentials are present; account sync requires project setup and migrations. AI planning is not part of the current module set.
## Brand Commitments
Keep Myhabit identity, Anuphan, Thai/English and a restrained warm orange accent. Global light/dark/system theme; no module-specific themes.
## Product Principles
- Settings and daily planning are understandable and reversible.
- Defaults never silently rewrite a recorded day.
- Optional check-ins complete from real records, not duplicate data.
- Tools are available when needed, without compulsory daily work.
