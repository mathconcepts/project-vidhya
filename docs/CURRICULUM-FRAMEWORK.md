# Curriculum Framework — Design & Admin Workflow

**Status:** implemented in v2.6.0
**Scope:** How Vidhya defines authoritative exam content, layers user materials on top with guardrails, and compounds content quality across iterations.

---

## 1. The problem

Previous state:
- 82 concepts hard-coded in `src/constants/concept-graph.ts`
- 5 exams hard-coded in `src/syllabus/exam-catalog.ts`
- No separation between "official syllabus" and "personalized plan"
- No feedback loop from student engagement back to content quality
- No guardrails keeping user materials or LLM output inside syllabus scope

Consequences:
- Adding a new exam requires a code PR
- There's no way to know which content is underperforming
- User-uploaded materials can drift lessons off-syllabus
- Admins have no credible workflow to grow the curriculum

---

## 2. The two-layer data model

```
┌──────────────────────────────────────────┐
│  Concept Graph (shared, static)          │
│  82+ concepts with prerequisites          │
│  src/constants/concept-graph.ts           │
└──────────────────────────────────────────┘
                ▲
                │ many-to-many
                │ (depth, weight, emphasis per link)
                ▼
┌──────────────────────────────────────────┐
│  Exam Definitions (admin-owned, YAML)     │
│  data/curriculum/*.yml                    │
│  One file per exam                         │
└──────────────────────────────────────────┘
```

**Concept Graph** is shared infrastructure. A concept like `eigenvalues`
exists once, is referenced by many exams.

**Exam Definitions** live as YAML in `data/curriculum/`. Each file is
authoritative for one exam and specifies:
- Metadata (name, conducting body, scope, duration, total marks)
- Hierarchical syllabus sections with weights
- `concept_links`: which concepts are covered, at what depth, with what
  emphasis, and any scope restrictions for this exam

---

## 3. Why concepts are shared, not duplicated

`eigenvalues` appears in GATE, JEE Advanced, CSIR-NET, UPSC ESE. If each
exam had its own concept, we'd have 4 copies of the same underlying
content with 4 sets of explainers, worked examples, and traps to maintain.

Instead, one concept, four links. Each link specifies *how* that concept
appears in that exam:

```yaml
# data/curriculum/gate-ma.yml
concept_links:
  - concept_id: eigenvalues
    depth: standard
    weight: 0.08        # 8% of exam
    emphasis:
      - 2x2-and-3x3-matrices
      - characteristic-polynomial-shortcuts
      - diagonalization-for-powers
    restrictions:
      - no-infinite-dimensional
      - no-abstract-spectral-theory
```

```yaml
# data/curriculum/csir-net-math.yml
concept_links:
  - concept_id: eigenvalues
    depth: advanced
    weight: 0.12
    emphasis:
      - spectral-theorem
      - jordan-canonical-form
      - operator-theory
    restrictions: []  # no scope limits for CSIR-NET
```

Same concept, different treatment per exam. The Lesson composer receives
the active exam context and can adjust:
- Which worked examples to use (filter by emphasis tags)
- How much formal content to show (depth)
- What constraints to respect (restrictions)

This is **scope-as-data**, not scope-as-if-branches.

---

## 4. User materials with guardrails

Students upload notes at `/materials`. These flow into Lessons as the
highest-priority source (most resonant). But we must prevent two risks:

1. Off-syllabus drift — user uploads a PhD paper on functional analysis,
   the chunk surfaces in a GATE lesson, student learns material that
   won't appear on their exam.
2. Wrong-depth drift — user uploads a CSIR-NET prep book, the chunk
   surfaces in a GATE lesson with advanced depth the student doesn't need.

**The guardrail system** (`src/curriculum/guardrails.ts`) applies three
checks before user material flows into a Lesson:

| Check | How | Fail action |
|-------|-----|-------------|
| **Concept-scope match** | Chunk's detected concept ∈ exam's concept_links | Chunk excluded from lesson |
| **Depth compatibility** | Chunk's inferred depth ≤ exam link's depth + 1 | Chunk flagged, shown with warning |
| **Restriction compliance** | Chunk's inferred subtopic ∉ exam link's `restrictions` | Chunk excluded |

**Concept detection for chunks** uses similarity matching against each
concept's description vector (already computed by `transformers.js`
client-side).

**Depth inference** uses a simple keyword heuristic (advanced/proof-heavy
keywords → advanced; shortcut/trick keywords → introductory; everything
else → standard). Good enough; no LLM call.

**Restrictions** are fuzzy-matched against chunk text.

Guardrails **never delete** user materials. They only filter *in-context*.
The student still sees their full uploads at `/materials`; they just
don't leak into unrelated-exam lessons.

---

## 5. The compounding quality loop

Every lesson view produces engagement signals (already wired in v2.5):

- `viewed` — component appeared ≥ 3s
- `revealed` — student tapped to see an explanation
- `completed` — student marked it done or answered correctly
- `skipped` — student moved past without interaction

These flow into the **quality aggregator**
(`src/curriculum/quality-aggregator.ts`) which:

1. Groups signals by `(concept_id, component_kind)`
2. Computes per-component metrics:
   - `view_rate` — did it hold attention?
   - `reveal_rate` — did students want more depth?
   - `completion_rate` — did they engage fully?
   - `skip_rate` — did they bounce?
3. Combines into a composite `quality_score` (0..1)
4. Flags components below a configurable threshold (default 0.6)
5. Stores in a flat-file (`.data/curriculum-quality.json`) — DB-less

The admin dashboard (`/admin/curriculum`) surfaces:
- Top-N components by skip_rate (underperforming)
- Top-N components by reveal_rate (highly engaging — worth amplifying)
- Delta vs previous iteration (is quality compounding?)

**The loop:**

```
student interacts → engagement signals → quality scores
    → flagged components → admin review → content updates
    → bundle rebuild → students interact (iter++) →
    improved engagement → higher quality scores
```

Each cycle is one iteration. The dashboard shows iteration-over-iteration
deltas so curators can see their work compounding.

---

## 6. Admin workflow — credible, per-exam

To onboard a new exam:

**Step 1 — Write the exam definition.**
Create `data/curriculum/{exam-id}.yml` by copying an existing one as a
template. Fill in:
- Metadata (name, body, scope, marks, duration)
- Official syllabus topics with weights
- Initial set of concept_links with conservative depth/emphasis

**Step 2 — Run the gap analyzer.**
```bash
npx tsx scripts/admin/analyze-gaps.ts --exam new-exam-id
```
This prints:
- Concepts in the exam that lack explainers
- Concepts that lack bundle problems
- Concepts that lack Wolfram verification
- Prioritized by `weight × emptiness`

**Step 3 — Generate content for gaps.**
For each high-priority gap, run:
```bash
# Top up explainers (uses Gemini, ~$0.001 per concept)
GEMINI_API_KEY=... npx tsx scripts/build-explainers.ts --concept eigenvalues

# Scrape more problems from licensed sources
npx tsx scripts/scrape-corpus.ts --topic linear-algebra --target 10

# Verify problem answers
WOLFRAM_APP_ID=... npx tsx scripts/verify-wolfram-batch.ts
```

**Step 4 — Rebuild bundle.**
```bash
npx tsx scripts/build-bundle.ts
npx tsx scripts/restore-wolfram-flags.ts  # preserve verification flags
```

**Step 5 — Review quality, iterate.**
```bash
npx tsx scripts/admin/quality-report.ts --exam new-exam-id
```
Flagged components → targeted content updates → repeat Step 4.

The workflow is **scripted, idempotent, and exam-agnostic** — the same
commands work for any exam, because everything is data-driven.

---

## 7. What makes this modular, portable, scalable

**Modular:** Three independent subsystems
- `src/constants/concept-graph.ts` — shared concepts (infrastructure)
- `data/curriculum/*.yml` — per-exam definitions (data)
- `src/curriculum/*.ts` — runtime (loader, guardrails, gap analyzer,
  quality aggregator)

No subsystem needs to change to add a new exam. Only data.

**Portable:** Every persistent artifact is a file
- Exam definitions: YAML in repo
- Content bundle: JSON in `frontend/public/data/`
- Quality metrics: JSON in `.data/`
- Student state: client-side IndexedDB

Pack up the repo → drop on any Linux host → it runs. No database
migration, no admin panel bootstrap.

**Scalable:**
- Adding an exam: write one YAML, run three scripts
- Adding a concept: one line in concept-graph.ts, then link to exams
- Serving more students: stateless server, no per-user storage cost

---

## 8. Shared-concept strategy in detail

When a concept appears in multiple exams, the Lesson composer uses the
**active exam context** to filter which content fragments surface:

```
request: lesson for "eigenvalues" with exam_id="gate-ma"
  → resolver pulls ALL bundle content for eigenvalues
  → composer consults curriculum.getConceptLink("eigenvalues","gate-ma")
  → returns: { depth: standard, emphasis: [2x2/3x3, shortcuts], 
               restrictions: [no-infinite-dim, no-spectral-theory] }
  → composer filters:
    * worked_examples with difficulty ≤ standard
    * explanations tagged "shortcut" or "computational" preferred
    * formal_statement showing 2D/3D proofs, not abstract spectral thm
```

The content bundle contains rich material at all depths. The curriculum
layer decides which slice to serve for a given exam. One bundle, many
curricula.

---

## 9. File manifest

**New files** (v2.6.0):
- `docs/CURRICULUM-FRAMEWORK.md` — this document
- `src/curriculum/types.ts` — ExamDefinition, ConceptExamLink, ContentGap, QualitySignal, ComponentQuality
- `src/curriculum/exam-loader.ts` — YAML→ExamDefinition with validation
- `src/curriculum/concept-exam-map.ts` — bidirectional lookups, shared-concept queries
- `src/curriculum/guardrails.ts` — off-syllabus detection
- `src/curriculum/gap-analyzer.ts` — missing-content detection
- `src/curriculum/quality-aggregator.ts` — engagement → component quality
- `data/curriculum/gate-ma.yml` — first exemplar exam definition
- `src/api/curriculum-routes.ts` — admin HTTP surface
- `scripts/admin/analyze-gaps.ts` — gap-analysis CLI
- `scripts/admin/quality-report.ts` — quality-report CLI

**Modified files:**
- `src/lessons/composer.ts` — accepts optional exam context, applies link filters
- `src/lessons/source-resolver.ts` — runs user material chunks through guardrails
- `src/gate-server.ts` — registers curriculum routes

---

## 10. What this framework explicitly does NOT do

- **Not an LLM-generated-content factory.** Admins decide what's in the
  syllabus. The framework makes it easy to fill gaps with trusted sources,
  but it doesn't auto-publish anything.
- **Not a classroom management system.** No teachers, no classes, no
  assignments.
- **Not a certification system.** Doesn't issue marks or certificates.
- **Not opinionated about pedagogy.** Pedagogy lives in the Lesson
  framework. Curriculum is the "what", not the "how".

---

*This is the source of truth for curriculum-layer design. Changes to
ExamDefinition schema, the guardrail contract, or the admin workflow
should be proposed here first.*
