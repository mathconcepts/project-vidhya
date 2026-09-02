---
# Alternative body for analytic-functions.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: analytic-functions.worked-example.assured
concept_id: analytic-functions
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: analytic-functions.worked-example
for_stance: assured
---

$u=e^x\cos y$: check harmonic first ($u_{xx}+u_{yy}=e^x\cos y-e^x\cos y=0$), then integrate $v_y=u_x=e^x\cos y$ to get $v=e^x\sin y+g(x)$; $v_x=-u_y$ forces $g'(x)=0$, so $v=e^x\sin y+C$. Assembled: $f=e^x(\cos y+i\sin y)+iC=e^z+iC$.

The reconstruction is always integrate-then-fix, never guess-then-verify: guessing wastes time hunting for a $v$ the two CR equations hand you directly, and it's easy to guess a $v$ that merely looks plausible while missing the additive constant CR actually leaves undetermined.

Same method backwards, different function: given $v=2xy$ instead, $u_x=v_y=2x\Rightarrow u=x^2+h(y)$; $u_y=-v_x\Rightarrow h'(y)=-2y\Rightarrow h=-y^2+C$, giving $u=x^2-y^2+C$ — the $u\leftrightarrow v$ roles swap but the mechanism doesn't change.
