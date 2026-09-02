---
# Alternative body for analytic-functions.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: analytic-functions.intuition.assured
concept_id: analytic-functions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
variant_of: analytic-functions.intuition
for_stance: assured
---

CR at a point is necessary, never sufficient by itself — analyticity needs CR plus continuous partials on an open neighborhood, not a single point or a curve.

Take $f(z)=x^2+iy^2$: $u_x=2x$, $v_y=2y$, so $u_x=v_y$ only on the line $x=y$; $u_y=0=-v_x$ everywhere. CR is satisfied along that whole line, yet $f$ is analytic **nowhere** — no point on it has an open disc around it where CR also holds.

Compare $1/z$: analytic on $\mathbb{C}\setminus\{0\}$, an open set, so it's analytic almost everywhere without being entire — one missing point costs entirety, not analyticity elsewhere.

Fastest disqualifier before touching CR at all: check whether $u,v$ are harmonic ($\nabla^2u=0$). Analytic forces harmonic, so failing that rules out analyticity immediately.
