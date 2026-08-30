---
# Alternative body for conformal-mapping.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: conformal-mapping.worked-example.assured
concept_id: conformal-mapping
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: conformal-mapping.worked-example
for_stance: assured
---

$f(z)=z+1/z$: analytic on $\mathbb C\setminus\{0\}$ ($1/z$'s only pole), and $f'(z)=1-1/z^2=0$ exactly at $z=\pm1$. So $f$ is conformal on $\mathbb C\setminus\{0,1,-1\}$ — the pole excludes one point on analyticity grounds, the critical points exclude two more on the derivative condition, and the two reasons don't overlap.

Answering with only half the picture loses marks: "conformal except where $f'=0$" alone misses the pole, and "analytic except at $z=0$" alone misses the critical points — a complete answer checks *both* conditions, not the easier one.

Fast verification at a regular point: $z=2$ gives $f'(2)=\frac34\neq0$ — conformal, consistent.

On the standard domain $|z|>1$ used for Joukowski airfoils, both critical points $z=\pm1$ sit exactly on the boundary circle $|z|=1$, not inside it — the open exterior region is already free of critical points, and only the pole at $z=0$ (also outside this domain) needed ruling out to begin with.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Joukowski conformal condition","steps":[{"prompt":"Step 1: Is $f(z) = z + 1/z$ analytic on $\\mathbb{C}$?","hint":"What singularities does $1/z$ have?","answer":"No. $f$ has a pole at $z=0$, so it is analytic on $\\mathbb{C} \\setminus \\{0\\}$."},{"prompt":"Step 2: Compute $f'(z)$.","hint":"Differentiate term-by-term. Recall $(z^{-1})' = -z^{-2}$.","answer":"$f'(z) = 1 - 1/z^2$."},{"prompt":"Step 3: Solve $f'(z) = 0$ for critical points.","hint":"Set $1 - 1/z^2 = 0$, multiply by $z^2$, and solve.","answer":"$z^2 = 1$, so $z = 1$ or $z = -1$ are the critical points."},{"prompt":"Step 4: Where is $f$ conformal?","hint":"Conformal = analytic AND $f'(z) \\neq 0$. Exclude the pole and critical points.","answer":"$f$ is conformal on $\\mathbb{C} \\setminus \\{0, 1, -1\\}$."}],"caption":"At a critical point, the conformal property breaks: angles collapse."}
```
