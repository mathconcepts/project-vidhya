---
id: rank-nullity.intuition
concept_id: rank-nullity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

When a matrix acts on vectors, two things happen at once: some information survives, and some disappears. Take the matrix from the animation above, $A=\begin{pmatrix}1&2\\0.5&1\end{pmatrix}$.

**Rank** counts how many independent directions of output the matrix actually produces. Here row 2 is exactly $0.5\times$ row 1 — no new information — so only one row is genuinely independent: $\text{rank}(A)=1$. That matches the animation: every arrow lands on a single line.

**Nullity** is the dimension of the null space — the directions that get crushed to zero. $A$ has 2 columns, and rank already used up 1 of those dimensions, so $\text{nullity}(A)=2-1=1$. Check it directly: $A\begin{pmatrix}2\\-1\end{pmatrix}=\begin{pmatrix}0\\0\end{pmatrix}$ — that's the one direction the animation showed shrinking to the centre.

The **Rank-Nullity Theorem** just says rank plus nullity always add up to the number of columns:

$$\text{rank}(A) + \text{nullity}(A) = n$$

Here, $1+1=2$ — the whole plane accounted for: one direction kept, one direction lost.

**Why it matters for GATE:** rank determines solvability of $A\mathbf{x}=\mathbf{b}$; full rank ($\text{rank}=n$) means invertible; rank-nullity gives the free-variable count immediately; it links row reduction, linear independence, and system consistency into one fact.

Add more independent rows and rank grows while nullity shrinks — they are opposites that must always balance to $n$.
