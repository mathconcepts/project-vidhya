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

Same matrix as the hook: $A=\begin{pmatrix}1&1\\0&2\end{pmatrix}$. Its columns are $v_1=(1,0)$ and $v_2=(1,2)$.

Try to write $v_2$ as a number times $v_1$: you'd need $(1,2)=c\times(1,0)=(c,0)$. That would need $c=1$ (to match the first entry) and $0=2$ (to match the second) at the same time — impossible. So $v_2$ is not a scaled copy of $v_1$. Together they're **independent**.

Now the "ghost" matrix from the hook, $\begin{pmatrix}1&1\\2&2\end{pmatrix}$: both columns are $(1,2)$ — the exact same vector. One is just $1\times$ the other, so it adds no new direction. That makes them **dependent**.

Check with the determinant: $\det(A)=1\times2-1\times0=2$, not zero — independent. $\det(\text{ghost})=1\times2-1\times2=0$ — dependent.
