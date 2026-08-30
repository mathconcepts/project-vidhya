---
# Alternative body for gauss-divergence.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: gauss-divergence.intuition.shaken
concept_id: gauss-divergence
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: gauss-divergence-intuition
for_stance: shaken
---

Take the cube $-1\le x,y,z\le1$, volume $8$, and the field $\mathbf F=(x,y,z)$. Its divergence is $\nabla\cdot\mathbf F=1+1+1=3$ everywhere, constant. The Divergence Theorem says the total flux out through the cube's six faces equals $\iiint_V 3\,dV=3\times8=24$, provided the cube's boundary is fully closed, with no missing face, and $\mathbf F$ has continuous partial derivatives inside it — both true here.

Check the front face alone, $x=1$: the outward normal is $\hat i$, so $\mathbf F\cdot\hat n=x=1$ across that whole face, and the face has area $4$, giving flux $4$ from that one face. By symmetry each of the six faces contributes $4$, and $6\times4=24$, matching the volume total exactly, without ever setting up a genuinely two-dimensional surface integral.

If the surface had a missing face — say the front face left off — the theorem would not apply at all, because flux through a closed surface and a sum over five patches with a hole are not the same measurement.
