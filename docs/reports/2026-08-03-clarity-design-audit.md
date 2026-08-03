# Clarity Design System — Full-Sweep Audit (2026-08-03)

## Why this ran

Giri uploaded `Vidhya_Clarity_Design_System.zip` reporting "design in the repo is not matching." Before touching anything I compared the zip against what's already in the repo:

- `design/clarity/` (tokens, guidelines, ui_kits, components) — byte-identical to the zip's `design_system/` folder (a few added `.d.ts` files aside).
- `DESIGN-SYSTEM.md` — byte-identical to the zip's `repo_docs/DESIGN-SYSTEM.md`.
- `frontend/src/styles/tokens/*.css` — byte-identical to `design/clarity/tokens/*.css`.

So the spec itself hadn't drifted — the live app had drifted from its own spec. That reframed the ask from "resync the spec" to "audit every page against the spec that's already correct," which is what the rest of this covers.

## Method

5 parallel review agents, each briefed with the DESIGN-SYSTEM.md rules verbatim and the canonical `frontend/src/components/ui/*.tsx` component list, split across all 67 `frontend/src/pages/app/*.tsx` files. Each reported only concrete file:line violations — no subjective taste calls — grouped by rule, with suggested fixes. Findings spanned every rule in the spec, at a scale much larger than a single "fix the drift" pass could safely absorb in one sitting (indigo-reservation violations alone touched dozens of files). I triaged into two buckets rather than doing a "quick surface pass": **fixed now** (mechanical, zero visual-regression risk) and **backlog** (judgment calls that could change layout/spacing/visual weight and deserve a design pass, not a sed pass).

## Fixed and shipped (commit `3acc149`, pushed to `main`)

1. **Systemic color bug — stale orange RGB.** 47 files used `rgba(255,149,0,...)`, the pre-redesign macOS "systemOrange" value. The live `--orange` token is `#ff9f0a` (`rgb(255,159,10)`). Corrected the RGB in place across all 47 files while preserving each site's own alpha — hue fix only, no visual-weight change.
2. **On-accent text contrast.** 36 files hardcoded `color: '#fff'` / `'white'` for text sitting on solid green/indigo fills instead of the `var(--text-on-accent)` token (same value today, but now token-driven so a future accent-color change doesn't silently break contrast). Included the canonical `ReceiptBorder.tsx` and `TutorFab.tsx` components.
3. **My own regression.** `SetupWizardPage.tsx`, `RunConsolePage.tsx`, `GraphBrowserPage.tsx` (built earlier this session) had hardcoded `#B87503` instead of `var(--orange-ink)`. Fixed.
4. **SyllabusBridgePage.tsx** — emoji/unicode glyphs (👍 👎 ▼ ▶) swapped for lucide `ThumbsUp`/`ThumbsDown`/`ChevronDown`/`ChevronRight` icons (spec: no emoji anywhere). Also fixed 3 real contrast bugs — dark `var(--text-primary)` text rendered directly on solid green/indigo button fills (Submit batch, wizard Next, Review content) — switched to `var(--text-on-accent)`.
5. **ScenariosPage.tsx** — unicode status glyphs (✓ ✗ ⏸) replaced with the spec's 9px coloured status dot (status is a dot, not an icon or emoji glyph).
6. **VerifyPage.tsx** — the "verified" status card had a hand-rolled green-tinted border imitating a receipt without going through the real `<ReceiptBorder>` component. Replaced with the actual receipt-border token treatment (`inset 0 0 0 1px var(--receipt-line)` on `var(--surface-card)`), and swapped the failed/pending cases from hardcoded rgba() literals to `var(--red-tint)` / `var(--orange-tint)`.

Verified after every step: `npx tsc --noEmit` clean, frontend suite 230/230 passing.

## Deferred — backlog, not silently dropped

These showed up in the audit but each is a judgment call with real layout/visual-weight risk, so none were touched:

- **Indigo semantic reassignment** — indigo is reserved for AI/tutor/study-plan only ("nothing else uses indigo"). The audit found indigo used more broadly across roughly 60 page files (this needs a per-usage read to separate legitimate AI-surface use from drift — not a mechanical fix).
- **Type-scale floor violations** — instances of student-facing text below the 17px body floor / 15px supporting floor.
- **Touch-target resizing** — interactive elements under the 44px minimum outside the chip exception.
- **Remaining hardcoded-color → token normalization** — colors beyond the orange-RGB and white-text cases already fixed; collapsing these to tint tokens risks changing visual weight since alpha values vary site to site.
- **Motion curve/duration normalization** — anything outside the single `cubic-bezier(0.32,0.72,0,1)` curve or the 100/180/280/420ms duration set.
- **Backdrop-blur cleanup** — glass/blur usage outside nav/tab/sheet materials, notably in `ExamSetupPage.tsx` and `TeachingDashboardPage.tsx`.

## Recommendation

Ship what's fixed (done), then take the backlog list either as a follow-up design pass (page by page, since indigo reassignment especially needs eyes on each usage) or prioritized subset if only some of it matters before the next demo.
