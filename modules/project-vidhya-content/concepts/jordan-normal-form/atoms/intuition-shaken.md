---
# Alternative body for jordan-normal-form.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, the arithmetic
# done in full, and an explicit check. No praise, no reassurance.
id: jordan-normal-form.intuition.shaken
concept_id: jordan-normal-form
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: jordan-normal-form.intuition
for_stance: shaken
---

Take $J=\begin{pmatrix}2&1\\0&2\end{pmatrix}$.

$Jv$ where $v=(1,0)$: gives $(2,0)=2v$. Ordinary eigenvector.

$Jw$ where $w=(0,1)$: gives $(1,2)=2w+v$. Not a clean scale — $w$ picks up a copy of $v$.

That extra $+v$ is the whole idea. One eigenvector ($v$), one *generalized* eigenvector ($w$) chained to it by $(A-2I)w=v$. Together they fill the two slots a $2\times2$ block needs, even though only one of them is a genuine eigenvector.
