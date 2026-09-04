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

Take hook's $A=\begin{pmatrix}5&1&0\\0&5&1\\0&0&5\end{pmatrix}$.

Solve $(A-5I)v=0$: only one direction works, $v=(1,0,0)$. Check: $Av=(5,0,0)=5v$. One true eigenvector, even though $5$ is an eigenvalue three times over.

Try $w_1=(0,1,0)$: $Aw_1=(1,5,0)$. That is not $5w_1=(0,5,0)$ — there is an extra $(1,0,0)=v$ tacked on. So $Aw_1=5w_1+v$. $w_1$ is a **generalized eigenvector**: one step short of a true eigenvector, because applying $A$ to it drags along a copy of $v$.

Try $w_2=(0,0,1)$: $Aw_2=(0,1,5)=5w_2+w_1$. Same pattern, one link further down the chain.

Three vectors — $v$, $w_1$, $w_2$ — now fill in for the three eigenvectors diagonalization needed but could not find. That is a Jordan chain, and it is exactly what the $1$'s above $A$'s diagonal were already telling you.
