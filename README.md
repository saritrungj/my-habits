# Myhabit

Myhabit brings daily routines, tasks and progress into one calm, phone-first workspace. It includes optional goals, focus and mood check-ins, plus local-only bill splitting and selected everyday converters.

## Requirements

- Node.js `26.11.1` (see `.nvmrc`)
- npm `12.2.0`
- Supabase project for email sign-in and cross-device sync (optional while using local mode)

## Run locally

```powershell
npm install
Copy-Item .env.example .env
# Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY in .env
npm run dev
```

Open the local URL printed by Nuxt. The app can run in local mode before Supabase is configured. Local data is stored in IndexedDB; selecting “Sign in” only imports guest data after you accept the prompt.

## Supabase

1. Create a project and copy its project URL and publishable key to `.env`.
2. Apply [`supabase/migrations/20261008000100_myhabit_workspace.sql`](supabase/migrations/20261008000100_myhabit_workspace.sql) with the Supabase CLI or the SQL editor.
3. Keep email authentication enabled and add `/auth/callback` URLs for local and production app origins in the Auth URL allowlist.
4. Keep any Supabase secret key on the server. The app uses the publishable key and user-scoped RLS.

The migration stores one versioned workspace document per user with optimistic revisions, a per-user mutation receipt table, and RLS. It also reads the existing `habit_days` table once after a signed-in user explicitly accepts the legacy import. The deployed Supabase project has not been migrated by this repository change.

## Data and privacy

- Guest data stays in its own local IndexedDB snapshot.
- Account data is isolated by Supabase Auth and RLS. Revision mismatches stop sync and ask the user which version to keep.
- Bill drafts stay on the current device and are excluded from cloud sync. PromptPay numbers are kept in memory only while a QR is generated locally.
- Backups are portable JSON files. Import merges records by stable IDs and keeps the current value when the same date has conflicting habit entries.
- Legacy Sprout JSON and local Myhabit data can be imported on the same browser origin or from a selected backup file.
- Currency conversion uses daily ECB reference rates through Frankfurter without an API key. The app checks complete, consistent quotes and shows their date; saved public rates remain usable with a warning if a refresh fails.
- Production builds support installation and offline navigation after one online visit. The service worker caches versioned app files and an anonymous client shell, never account responses or API data. Development mode does not register it.
- AI planning is outside the current feature set; no AI provider or credentials are configured.

## Commands

```powershell
npm run dev
npm run typecheck
npm run build
npm test
npm run test:e2e
```

Install Playwright's Chromium once before running `npm run test:e2e`:

```powershell
npx playwright install chromium
```

Architecture, migration sequence, and release checks are documented in [`docs/MYHABIT_INTEGRATION_PLAN_2026.md`](docs/MYHABIT_INTEGRATION_PLAN_2026.md). Stack version evidence is in [`docs/STACK_RESEARCH_2026.md`](docs/STACK_RESEARCH_2026.md).

## Calm themes and daily settings (v3)

- Open `/settings` for global theme, language, timezone, daily defaults and backup.
- Open a module's header settings button for the same module form (`/settings?section=modules&module=focus`, for example). Per-field overrides can return to global/default values. Save/Cancel is explicit.
- Repeating schedule edits start the next local day. On Today, “Edit this day’s plan” adds one-day items, changes times, skips items and moves task occurrences. Recorded habit plans and thresholds remain intact.
- Focus, mood and selected goal check-ins are opt-in. Completion is derived from existing records. The focus clock continues during client-side page navigation and applies duration changes to the next session; running and paused clocks survive full browser reloads in their account namespace. Expired sessions are recorded once.
- Backups now use schema v3. v2 snapshots remain in the existing `myhabit-v2` IndexedDB database and are normalized without resetting IDs, history or financial values. Older backups did not store historical titles/times; migration snapshots use the metadata available in the backup.
- Apply `supabase/migrations/20261008000200_workspace_v3.sql` after the original migration **before** enabling cloud writes from v3 clients. Cloud writes default to disabled. After applying the migration, set `NUXT_PUBLIC_WORKSPACE_V3_READY=true` and restart/rebuild. No hosted SQL has been applied by this change.
- Visual test artifacts are generated under `artifacts/ui-review/` and ignored by Git. Test data is synthetic.

## Complete module interactions

- Financial entries support date, currency, linked goals, search/filter, edit, deletion and Undo. The monthly THB total excludes other currencies.
- Goal progress supports savings and both weight gain/loss from the starting value. Goals and their entries can be edited; archived goals can be restored.
- Mood check-ins support gratitude and optional notes, history editing and deletion with Undo. Separate dates reset their own forms.
- Tasks support subtasks, removing/undoing subtasks and archive/restore. Recurrence edits preserve recorded plans.
- Bill drafts preserve names and weighted shares after reload, with deletion/Undo. PromptPay QR generation discards stale asynchronous results.
- Controls across all routes share fast hover, press, focus and selected states. Check confirmations, progress and converter results provide brief feedback. Reduced motion removes spatial transitions and repetitive animation.

Account sign-in and cross-device sync require your Supabase project configuration and applied migrations. Local functionality works without them; this change did not provision a hosted project or apply hosted migrations.
