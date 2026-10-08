# Myhabit calm themes and daily settings v3

Implemented and verified locally on 2026-10-08 using the existing pinned Nuxt/Nuxt UI/Tailwind/Vite/Supabase stack.

## Delivered behavior

- One light/dark/system preference drives Nuxt UI and Myhabit semantic colors. System theme changes are observed. QR remains black on white.
- Global settings are grouped into General, Daily plan, Modules and Data & account. Module header shortcuts open the same form. Each applicable field supports inheritance, override and reset, with explicit Save/Cancel and validation.
- Habit templates support title, description, time, period, inherited or explicit weekdays and archive. Task templates support one-off/repeating schedules, dates, times, priorities, subtasks and archive. Repeating template edits are versioned to start tomorrow.
- Today displays the chosen date's habits and tasks, plus opt-in focus, mood and selected goal check-ins. Day overrides add items, change times, skip items or move task occurrences. Movement preserves the original occurrence identity.
- Recorded habit metadata, thresholds and daily plan snapshots remain stable. Skips do not count as completion. Habit streak/ring exclude tasks and check-ins.
- Focus completion uses real saved sessions. Active timers survive client-side navigation and settings edits; new duration settings apply to the next session. Account changes reset the active timer. Mood updates replace the date's record; goals derive completion from linked records.
- Common-time reminders are grouped while the app is open, with owner/date/time receipts. Tool defaults drive actual bill calculations and unit pairs. PromptPay identifiers remain outside settings and backups.
- v2 snapshots/backup/cloud payloads normalize into v3 without changing the IndexedDB database or account namespaces. Backup imports retain ledger IDs, deduplicate repeated imports and preserve notes, completion metadata and recorded plans.
- `PRODUCT.md`, `DESIGN.md` and `docs/MYHABIT_DAILY_SETTINGS_SURFACE.md` record product, visual and surface decisions.

## Verification

| Check | Result |
| --- | --- |
| Typecheck (`nuxt prepare && tsc --noEmit`) | Passed |
| Vitest | 22 tests passed, 3 files |
| Production build | Passed |
| Playwright functional checks | 11 passed on the final production build |
| Playwright visual/theme check | Passed in the confirmation capture round |
| Semantic text contrast | Both themes passed 4.5:1 checks for main, muted, brand, status, primary-button and calendar heatmap text/surface pairs |
| Responsive checks | 390px/1280px captures, additional 360px route overflow checks passed |
| Keyboard, focus and reduced motion | Passed keyboard-save, visible-focus, 44px button and reduced-motion assertions |
| QR | Generated locally in both themes; black foreground on white |
| Impeccable detector | No findings in its single implementation scan |
| Local HTTP | `/today` and `/settings` returned 200 on port 3000 |
| Git diff whitespace | Passed |

Functional E2E covers shared module settings, inheritance/reset/cancel, reload and offline persistence, date isolation, system theme changes, active focus settings visits, real check-ins, tool defaults, keyboard operation, repeated backup imports and settings-only reset. Unit tests cover recurrence and timezone handling, template versions, daily overrides, completion/streak criteria, v2/v3 compatibility and contrast.

Visual review used one desktop/mobile light/dark batch and one confirmation batch across Today, Settings, Progress and Finance. Synthetic fixtures produced 16 screenshots per batch under `artifacts/ui-review/`; these are ignored by Git. Review fixed secondary light-text contrast and unchecked habit icons. Final light soft-status surface adjustments were verified through the semantic contrast tests without starting another screenshot round.

## Remaining deployment checks and boundaries

1. Apply `supabase/migrations/20261008000200_workspace_v3.sql` after the original workspace migration. Its RPC accepts v2/v3 while retaining revision checks, mutation receipts and existing RLS. Hosted SQL/auth/RLS checks have not been run because project credentials are absent.
2. After the migration succeeds, set `NUXT_PUBLIC_WORKSPACE_V3_READY=true` and restart/rebuild. Cloud writes are gated off by default; local persistence remains available.
3. TypeScript 7 currently cannot run the selected vue-tsc release. The TypeScript check covers `.ts` sources; Vue SFCs are compiled by the production build and exercised by E2E, but do not receive a full vue-tsc template typecheck.
4. An active timer is held in memory and does not survive a full browser reload. Reminders require notification permission and an open app. Offline writes persist locally; this build does not provide an installable PWA or guaranteed offline startup.
5. v2 backups did not contain historical title/time versions. Their snapshots preserve IDs, criteria and completion data, using the metadata available in the backup.
6. Existing dependency advisories recorded by the earlier stack audit require deployment review. Build warnings include the large main client chunk and upstream deprecated package export mappings.
