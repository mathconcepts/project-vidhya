# Authoring Atoms — quick templates

This is the cookbook for content authors writing atoms under
`concepts/{concept_id}/atoms/*.md`. One atom = one markdown file with YAML
frontmatter and a body that may contain math (`$...$`, `$$...$$`) and
interactive directives (`:::name{attrs}`).

Every atom MUST have: `id`, `concept_id`, `atom_type`, `bloom_level`,
`difficulty`, `exam_ids`. Optional: `modality`, `scaffold_fade`,
`animation_preset`, `tested_by_atom`, `interactives`.

The eleven `atom_type` values map to dedicated card chrome:

| atom_type           | when to write it                               |
|---------------------|------------------------------------------------|
| `hook`              | First 1–2 sentences that frame why this matters |
| `intuition`         | Plain-language picture, before formal symbols  |
| `formal_definition` | LaTeX-grade statement of the rule              |
| `visual_analogy`    | Geometric / diagrammatic intuition             |
| `worked_example`    | Step-by-step solve; supports scaffold-fade     |
| `micro_exercise`    | One-question check                             |
| `common_traps`      | Things students get wrong, with fixes          |
| `retrieval_prompt`  | Prompt to retrieve from memory                 |
| `interleaved_drill` | Mixed practice across recent concepts          |
| `mnemonic`          | Memory hook                                    |
| `exam_pattern`      | Exam-specific cue / format reminder            |

## Templates — copy and edit

### hook.md

```markdown
---
id: <concept-id>.hook
concept_id: <concept-id>
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
modality: text
---

One sentence that names the question this concept answers, and why it
shows up on the exam. End with a hook the reader wants resolved.
```

### intuition.md (with interactives)

```markdown
---
id: <concept-id>.intuition
concept_id: <concept-id>
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
modality: visual
interactives: [interactive-ref-1, interactive-ref-2]
---

Plain-language picture. Use $inline math$ for symbols, but lead with
the analogy. Reference an interactive when manipulation beats prose:

:::interactive{ref=interactive-ref-1}
:::

Optional second pass with sliders or a 3D plot:

:::interactive{ref=interactive-ref-2}
:::
```

### formal_definition.md

```markdown
---
id: <concept-id>.formal-definition
concept_id: <concept-id>
atom_type: formal_definition
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
modality: text
---

The rule, stated cleanly. Use display math:

$$
f'(a) = \lim_{h \to 0} \frac{f(a+h) - f(a)}{h}
$$

Two-sentence cap on prose. The math should do the work.
```

### worked_example.md (with scaffold-fade)

```markdown
---
id: <concept-id>.worked-example.<topic>
concept_id: <concept-id>
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
modality: text
scaffold_fade: true
---

State the problem. Steps separated by `\n---\n` so revisits blank the
trailing steps for retrieval practice.

**Step 1.** Identify the rule.

---

**Step 2.** Set up.

---

**Step 3.** Compute.

---

**Step 4.** State the answer.
```

### common_traps.md (linked to a check)

```markdown
---
id: <concept-id>.common-traps
concept_id: <concept-id>
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
modality: text
tested_by_atom: <concept-id>.micro-exercise
---

The two or three errors that crop up most. State each as a wrong→right pair.
The cohort callout fires automatically when ≥10 students have attempted
`tested_by_atom` and ≥50% got it wrong.
```

### micro_exercise.md (one-shot check)

```markdown
---
id: <concept-id>.micro-exercise
concept_id: <concept-id>
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: drill
---

A single, fast question. The renderer adds Got-it / Not-yet buttons; no
extra UI needed.
```

### micro_exercise.md with `:::verify` (Wolfram-backed)

```markdown
---
id: <concept-id>.verify-product-rule
concept_id: <concept-id>
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
modality: drill
---

Differentiate $f(x) = x^2 \cdot \sin(x)$.

:::verify{expected="2*x*sin(x) + x^2*cos(x)" prompt="Type your answer"}
:::
```

When `WOLFRAM_APP_ID` is set, the server compares via `Simplify[(student) - (expected)]`.
Otherwise it uses a deterministic local check (whitespace + casing + simple
algebraic-form normalization). The student's UX is identical.

### exam_pattern.md (exam-gated)

```markdown
---
id: <concept-id>.exam-pattern.gate
concept_id: <concept-id>
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["EXM-GATE-CS"]
modality: text
---

How GATE phrases this. One representative stem, one cue ("when you see
'find the rate', start with…").
```

## Interactives directives — reference

| Directive            | Tier | Notes                                              |
|----------------------|------|----------------------------------------------------|
| `:::math3d`          | 1    | MathBox 3D plot                                    |
| `:::parametric`      | 1→2  | MathBox primary, Desmos fallback                   |
| `:::vectorfield`     | 1    | MathBox vector field                               |
| `:::surface`         | 1    | MathBox surface                                    |
| `:::slider`          | 2    | Desmos slider-driven plot                          |
| `:::graph2d`         | 2    | Desmos 2D plot, MathBox fallback                   |
| `:::cas`             | 3    | GeoGebra CAS                                       |
| `:::construct`       | 3    | GeoGebra geometric construction                    |
| `:::manim`           | 0    | Pre-rendered MP4 + VTT captions                    |
| `:::quiz`            | UI   | Inline multi-choice                                |
| `:::recall`          | UI   | Flashcard flip                                     |
| `:::verify`          | API  | POST /api/lesson/verify (Wolfram or local)         |
| `:::interactive`     | lib  | Reference an entry from interactives-library/      |

Prefer `:::interactive{ref=name}` for anything reused across atoms — author
once in `interactives-library/<name>.json`, ref everywhere. The lint script
(`npm run lint:interactives`) catches broken refs at build time.

## Workflow

1. Copy the relevant template into `concepts/<concept-id>/atoms/<atom>.md`.
2. Fill the frontmatter; pick `bloom_level` and `difficulty` honestly.
3. Write the body. Math in `$...$` and `$$...$$`. Interactives via
   `:::name{attrs}` or `:::interactive{ref=name}`.
4. Run `npm run lint:interactives`. Fix any errors before committing.
5. Run `cd frontend && npm test` to make sure regression tests still pass.
