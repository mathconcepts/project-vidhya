---
# Alternative body for null-space-column-space.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: null-space-column-space.intuition.shaken
concept_id: null-space-column-space
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: null-space-column-space.intuition
for_stance: shaken
---

Take $A=\begin{pmatrix}1&2\\2&4\end{pmatrix}$. Try $x=\begin{pmatrix}2\\-1\end{pmatrix}$: $Ax=\begin{pmatrix}0\\0\end{pmatrix}$. That $x$ vanished — it's in the **null space**.

Now try $x=\begin{pmatrix}1\\0\end{pmatrix}$: $Ax=\begin{pmatrix}1\\2\end{pmatrix}$. That output, and every scalar multiple of it, is in the **column space** — everything $A$ can actually produce.

The two spaces answer opposite questions: null space asks "what gets erased?"; column space asks "what comes out the other side?" Rank-nullity ties them together — the size of one plus the size of the other always equals the number of columns going in.
