# Design System — Vidhya

## Product Context
- **What this is:** Mobile-first exam-prep platform with Study Commander (tells you what to study each day), AI tutor, camera scan, and smart notebook. Exam-agnostic: GATE, BITSAT, NEET, civil services, or any competitive exam configured via the exam adapter system.
- **Who it's for:** Competitive-exam aspirants (typically 18-28), studying late nights on mobile
- **Space/industry:** Competitive exam prep. Peers: EduRev, Testbook, GradeUp, Unacademy
- **Project type:** Progressive web app, mobile-first SPA
- **Differentiator:** Study strategist that tells you what to study next — priority engine based on marks weight, weakness, improvement speed, recency, and exam proximity. No other prep app provides personalized daily study plans across exams.

## The Memorable Thing (the north star)
**Compounding.** Every rep adds to the next. What you cracked in January is still with you in March. The visual system serves *this one promise* — substantial, journal-like, time-aware. Not gamified-warm, not techy-flashy. Real knowledge work that compounds.

Every typographic, color, and spacing decision below traces back to "does this feel like compounding knowledge or like a notification I'd dismiss?"

## Aesthetic Direction
- **Direction:** Editorial-Confident — warm dark theme, serif headline weight, restrained accents
- **Decoration level:** Restrained (typography and hierarchy do the work; surface layering minimal; glows reserved for one signature interaction)
- **Mood:** "Late-night journal you return to, not a notification stream." Substantial, considered, no nag. The book on your desk that knows you.
- **Reference posture:** Stripe Press (editorial weight), the Browser Company (warmth + restraint), classical exam-prep textbooks (knowledge tradition). Explicitly NOT Duolingo (too gamified) or generic edtech SaaS (too sterile).

## Typography
- **Display/Hero:** **Fraunces** (variable serif, 400-900, opsz 9-144, soft wonky setting) — editorial weight that signals knowledge tradition. Used for hero headings, topic names, score numbers, anywhere the design needs to feel substantial. Variable axes let the same font carry from chunky display sizes to refined h3s.
- **Body:** DM Sans (400-700) — clean readability, excellent x-height, pairs cleanly with Fraunces' literary tone.
- **UI/Labels:** DM Sans 500-600
- **Data/Tables/Math:** JetBrains Mono (400-600) — tabular-nums for problem IDs, LaTeX expressions, verification output. The mono signals "computed" vs "explained."
- **Code:** JetBrains Mono
- **Loading:** Google Fonts CDN — `family=Fraunces:opsz,wght,SOFT@9..144,400..900,30&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap`
- **Scale:** 11px (caption) / 13px (small) / 15px (body) / 18px (h3, Fraunces 500) / 22px (h2, Fraunces 600) / 32px (h1, Fraunces 700) / 48px (display, Fraunces 800)
- **Pairing rule:** Fraunces only at 18px+. Below 18px = DM Sans. Serifs at small sizes feel fragile on mobile.

## Color
- **Approach:** Restrained — two functional accents + one signature, deep neutral base. Reduced from three accents in v2.3 design tweak (every educational SaaS uses emerald/amber/sky; we picked something else).
- **Background:** `#0a0f1a` (deep navy-black)
- **Surfaces:** `#111827` (surface-1), `#1f2937` (surface-2), `#374151` (surface-3)
- **Primary accent (mastery):** `#10b981` (emerald) — correct answers, mastered concepts, primary CTA. Functional.
- **Signature (AI / Tutor / Study Plan):** `#a78bfa` (soft violet) — RESERVED for the tutor surface, the daily study plan card, and study-commander suggestions. This is Vidhya's signature color; no other surface uses it. Violet because no incumbent exam-prep app uses it; pairs naturally with Fraunces serif on dark navy; signals "thoughtful guidance" rather than alarm.
- **Warning/error only:** `#ef4444` (error), `#f59e0b` (warning) — used for system errors and timer running out, NOT as decorative accent. Amber demoted from "streaks/urgency" because streaks were removed in v2.3 declutter.
- **Text:** `#f9fafb` (primary), `#d1d5db` (secondary), `#9ca3af` (muted), `#6b7280` (dim)
- **Soft variants:** Emerald and violet each have a 15% opacity background variant for badges, alerts, soft buttons. Warning/error stay solid.
- **Dark mode:** This IS the primary theme.
- **Light mode (deferred — see TODO):** Light mode currently swaps backgrounds only (#f8fafc, #ffffff, #f1f5f9). Needs its own design pass: Fraunces and violet read differently on light surfaces; accent saturation likely needs reduction. Tracked as a follow-up.
- **Blog/public pages:** Same dark theme as app, AND now same typography (Fraunces + DM Sans) and same palette (emerald + violet, no Space Grotesk neubrutalist palette). Unified brand for real this time — see Blog section below.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — cards breathe, touch targets 44px minimum
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Grid-disciplined mobile app shell
- **Grid:** Single column on mobile (375px), 2-column topic grid, max 3xl (768px) content area
- **Max content width:** 768px (3xl)
- **Bottom nav:** 3 tabs — Home, Notes, Progress (+ Settings via header)
- **Tutor FAB:** 56px sky-blue floating action button (bottom-right, above nav). Always visible except on /chat. The tutor is the primary surface, not a peer tab.
- **Border radius:** sm:6px, md:10px, lg:16px, xl:24px, full:9999px
- **Cards:** Full-bleed on mobile with surface-1 background, surface-3 border, lg radius

## Motion
- **Approach:** Intentional (Framer Motion throughout)
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out) spring(stiffness:300, damping:30)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **Signatures:**
  - Celebration confetti on correct answers and milestones
  - Staggered fade-in for lists (50ms delay per item)
  - Count-up animations for stat numbers
  - Spring physics for nav indicator and interactive elements
  - Page transitions: fade + slight upward slide (200ms)

## New Features (Design Specs)

### Camera Scan (multimodal input)
- Full-screen camera viewfinder with emerald corner markers
- Center scanning zone (280x180px) with animated scan line
- Large capture button (64px circle, emerald, glow shadow)
- Gallery upload alternative below capture button
- After capture: show extracted text, allow edit, then verify

### Smart Notebook
- Topic filter pills (horizontal scroll, emerald active state)
- Entry list with completion status dots (emerald=mastered, amber=in-progress, gray=to-review)
- Each entry shows: query text, topic tag (mono, sky blue), timestamp
- Topic-wise grouping with completion percentage headers
- Search/filter bar at top

### Exam Readiness Score
- Composite badge on home page: emerald border, large score number
- Factors: topic coverage, accuracy %, SR health, weak spot count, days until exam
- Updates in real-time as student practices

## Blog & Public Pages

### Style: Editorial-Confident (matches the app, v2.3 unification)
- **Aesthetic:** Editorial weight via Fraunces headlines on the dark navy app palette. Bordered card structure preserved (it's good IA — every post gets its own enclosed space) but softened to fit the app: 1.5px borders (was 2px), 8-12px corners (was 4px), no offset shadow on hover (was `translate(3px,3px)`).
- **Typography:** Fraunces (display, ≥18px) + DM Sans (body, all <18px) + JetBrains Mono (code blocks). Same stack as the app — no Space Grotesk on public pages anymore.
- **Cards:** Each feed item is a bordered card with content-type accent color from the app palette (emerald for explainers, violet for AI/strategy posts). Hover lifts via subtle border-color shift to violet, not via shadow.
- **Badges:** 1.5px bordered, sentence-case (was uppercase — uppercase felt punky/Gen Z; sentence-case feels editorial/considered), 6px radius.
- **Influence:** Stripe Press, the Browser Company blog, Are.na editorial. The neubrutalist "standout" was real but disconnected from the app — blog/app coherence wins.

### Layout: Single-Column Feed
- **Index:** Single-column card feed. Each post gets a bordered neubrutalist card.
- **Filters:** Topic pills (uppercase, 4px corners) + sort tabs + content type tabs
- **Post page:** Full-width reading, max 700px. Sticky floating CTA bar at bottom.
- **Sort:** Uses `content_score` from Content Intelligence Engine for "Trending" sort.

### Blog Motion (CSS-only, zero JS)
- **Entrance:** `@keyframes enterUp` with staggered delay (80ms per card, capped at 640ms)
- **Hover:** Border-color shift to violet (`border-color: var(--violet)` + 200ms ease-out) — replaces the neubrutalist shadow-shift; feels considered rather than tactile-punchy
- **Scroll reveal:** `animation-timeline: view()` (CSS scroll-driven, progressive enhancement)
- **Reduced motion:** Full `prefers-reduced-motion:reduce` support — disables all animations and transitions
- **Budget:** ~4KB CSS total. Zero JavaScript. Fonts shared with app (Fraunces + DM Sans + JetBrains Mono — already loaded by app, blog gets free reuse).

### Blog-to-App Bridge
- Every blog post has an editorial app-feature CTA card (1.5px border, no shadow, violet accent for AI/study-plan CTAs, emerald for practice/diagnostic CTAs)
- Sticky CTA bar at bottom: 1.5px border, no shadow, "Practice [topic]" (emerald) + "Open Tutor" (violet) — the dual primary signals the two main app affordances
- Deep links to relevant app feature per content type (practice, onboard, diagnostic, chat)
- Conversion goal: a student lands on the blog from Google, reads, and the visual continuity makes "open the app" feel like turning the page rather than switching products.

## App Declutter Rules
- **Mental model:** Anytime help portal, not a test center. Tutor is always one tap away via FAB.
- **Header:** 48px height, "V" logo badge only (no product name text), streak + user avatar right.
- **Content padding:** `px-4 pt-2 pb-4` — saves 8px dead space at top of every page.
- **Progressive disclosure:** Collapse by default, expand on demand. ProgressPage shows top 3 topics; NotebookPage hides topic summary grid.
- **No dead ends:** Every terminal state (all done, free study day, celebration) links to the tutor.
- **Result simplification:** PracticePage shows compact result banner (icon + verdict), no verification metadata.
- **Onboarding:** 3-bucket tappable sort (Weak/Okay/Strong) instead of 10 individual sliders.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Initial design system created | /design-consultation based on competitive research (Duolingo, Photomath, Khan Academy, EduRev) |
| 2026-03-28 | Satoshi + DM Sans + JetBrains Mono | Satoshi for bold presence, DM Sans for readability, JetBrains for math expressions |
| 2026-03-28 | Dark-first with emerald/amber/sky | Late-night study context, emerald = mastery/success, amber = urgency/streaks, sky = AI/focus |
| 2026-03-28 | 6-tab nav (added Scan + Notebook) | Camera input and structured notebook are the key differentiators |
| 2026-03-28 | Exam Readiness Score | Single motivating metric that goes beyond "problems solved" |
| 2026-04-04 | Dark blog (unified brand) | Every exam-prep site has white blogs. Dark stands out, feels premium, matches app. 11.5:1 contrast ratio exceeds WCAG AAA |
| 2026-04-04 | Single-column feed layout | Card grids waste space on mobile. Feed is scannable, each post gets enough room to read |
| 2026-04-04 | CSS-only blog animations | Zero JS runtime cost. scroll-driven animations via CSS. Progressive enhancement for Safari |
| 2026-04-04 | Home declutter — removed welcome banner, consolidated CTAs | Topic grid is the product. CTAs should support, not compete with content |
| 2026-04-04 | Sticky floating CTA pill on blog posts | Less intrusive than inline button. Always visible without breaking reading flow |
| 2026-04-05 | Dark Neubrutalism blog redesign | Gen Z/Gen Alpha aesthetic. Hard borders, offset shadows, Space Grotesk. Excellent perf (WCAG AAA), zero JS, high personality. Via UI/UX Pro Max skill. |
| 2026-04-05 | prefers-reduced-motion support | Full accessibility: all blog animations + transitions disabled when user prefers reduced motion |
| 2026-04-10 | 3 tabs + Tutor FAB | Tutor is primary surface, not a peer tab. FAB = 1-tap access from anywhere. |
| 2026-04-10 | Collapse-by-default on Progress + Notebook | Tired students don't need 10 topic cards. Show weakest 3, expand on demand. |
| 2026-04-10 | 3-bucket onboarding | 10 sliders → 3 tappable buckets. Faster (10 taps vs 10 drags), more mobile-friendly. |
| 2026-04-10 | Compact practice results | Removed verification metadata (tier, ms, confidence). Students don't learn from "Gemini solved in 2.3s". |
| 2026-04-30 | Memorable thing = Compounding | Visual system has to lead with one promise. "Every rep adds to the next, January work still with me in March." Drives every choice below from this date forward. |
| 2026-04-30 | Display: Satoshi → Fraunces (variable serif) | Satoshi is the AI-design-tool default; converging. Serifs carry the "knowledge work" weight Compounding needs. Fraunces is variable + free + opsz-aware so one font carries display→h3. Pairing rule: Fraunces ≥18px only, DM Sans below. |
| 2026-04-30 | Color: 3 accents → 2 + signature | Emerald + violet (#a78bfa, signature for AI/Tutor/Plan). Amber/sky demoted (sky removed; amber kept ONLY for system warnings, not decoration). Reason: streaks were already removed in v2.3 declutter, amber's job shrunk. Three accents was visual noise on 375px screens. |
| 2026-04-30 | Blog: Dark Neubrutalism → Editorial-Confident | Pulls blog typography (Fraunces + DM Sans) and palette (emerald + violet) into alignment with app. Bordered card structure preserved (good IA), but borders soften (1.5px), corners round (8-12px), shadow-shift hover replaced with border-color shift. The "unified brand" claim from 2026-04-04 wasn't true; it is now. |
| 2026-04-30 | Aesthetic: Playful-Serious → Editorial-Confident | Playful was inherited from Duolingo benchmarking; doesn't fit Compounding. Editorial-Confident centres the journal/textbook tradition without losing dark-theme warmth. Decoration level moves intentional → restrained. |
