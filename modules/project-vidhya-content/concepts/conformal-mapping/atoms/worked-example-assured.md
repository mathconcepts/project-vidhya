---
# Alternative body for conformal-mapping.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: conformal-mapping.worked-example.assured
concept_id: conformal-mapping
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: conformal-mapping.worked-example
for_stance: assured
---

$f(z)=z+1/z$: analytic on $\mathbb C\setminus\{0\}$ ($1/z$'s only pole), and $f'(z)=1-1/z^2=0$ exactly at $z=\pm1$. So $f$ is conformal on $\mathbb C\setminus\{0,1,-1\}$ — the pole excludes one point on analyticity grounds, the critical points exclude two more on the derivative condition, and the two reasons don't overlap.

Answering with only half the picture loses marks: "conformal except where $f'=0$" alone misses the pole, and "analytic except at $z=0$" alone misses the critical points — a complete answer checks *both* conditions, not the easier one.

Fast verification at a regular point: $z=2$ gives $f'(2)=\frac34\neq0$ — conformal, consistent.

On the standard domain $|z|>1$ used for Joukowski airfoils, both critical points $z=\pm1$ sit exactly on the boundary circle $|z|=1$, not inside it — the open exterior region is already free of critical points, and only the pole at $z=0$ (also outside this domain) needed ruling out to begin with.
