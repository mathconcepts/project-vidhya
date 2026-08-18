---
# Alternative body for linear-independence.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: linear-independence.intuition.shaken
concept_id: linear-independence
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: linear-independence.intuition
for_stance: shaken
---

Three vectors in the plane: $v_1=(1,0)$, $v_2=(0,1)$, $v_3=2v_1=(2,0)$.

$v_1$ and $v_2$ point in different directions — neither is a copy of the other — so together they're **independent**.

$v_3$ is just $2v_1$: no new direction, only a longer copy of one already there. That makes $v_3$ **dependent** on $v_1$.

A set is independent when no vector in it can be written as a combination of the others — each one adds something genuinely new. That is exactly what a basis needs: enough vectors to reach everywhere, none of them wasted.
