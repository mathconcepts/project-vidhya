---
# Alternative body for matrix-norms.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, the arithmetic
# done in full, and an explicit check. No praise, no reassurance.
id: matrix-norms.intuition.shaken
concept_id: matrix-norms
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: matrix-norms.intuition
for_stance: shaken
---

Take $A=\begin{pmatrix}4&0\\0&3\end{pmatrix}$.

Feed in $v=(1,0)$: $Av=(4,0)$ — stretched by $4$.

Feed in $v=(0,1)$: $Av=(0,3)$ — stretched by $3$.

No other direction stretches more than $4$ or less than $3$ here, so $\|A\|_2=4$, and $\kappa_2(A)=4/3\approx1.33$: every direction gets stretched within a factor of $1.33$ of every other. That closeness is what "well-conditioned" means.
