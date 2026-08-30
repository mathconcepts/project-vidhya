---
# Alternative body for conformal-mapping.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: conformal-mapping.intuition.assured
concept_id: conformal-mapping
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: conformal-mapping.intuition
for_stance: assured
---

Conformal at $z_0$ $\iff$ $f$ analytic at $z_0$ **and** $f'(z_0)\neq0$ — both, checked at that exact point, not "analytic on the domain" in general. Near $z_0$, $f$ acts as multiplication by $f'(z_0)$: rotate by $\arg f'(z_0)$, scale by $|f'(z_0)|$, uniformly in every direction — that uniformity is why angles between any two directions survive.

Fastest disqualifier: find the zeros of $f'$ first. For $w=z+1/z$, $f'(z)=1-1/z^2=0$ at $z=\pm1$ — the domain minus $\{0,\pm1\}$ is conformal, full stop, no further checking needed since $f$ is analytic on $\mathbb C\setminus\{0\}$ and $f'\neq0$ off those two points.

Common false generalization: "entire $\Rightarrow$ conformal everywhere" — false at any zero of $f'$. $f(z)=z^2$ is entire but not conformal at $z=0$: angles double there instead of surviving.
