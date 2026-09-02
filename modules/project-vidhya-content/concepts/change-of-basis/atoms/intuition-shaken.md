---
# Alternative body for change-of-basis.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: change-of-basis.intuition.shaken
concept_id: change-of-basis
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
variant_of: change-of-basis.intuition
for_stance: shaken
---

$v_1=(1,1)$ and $v_2=(1,-1)$ form a basis $B$.

$x=(3,1)$ in standard coordinates. Write $x=a\,v_1+b\,v_2$: $a+b=3$, $a-b=1$. Solving: $a=2$, $b=1$.

So $[x]_B=(2,1)$.

The matrix $P=\begin{pmatrix}1&1\\1&-1\end{pmatrix}$ does this conversion in one multiplication instead of solving equations each time: $P^{-1}x = [x]_B$.
