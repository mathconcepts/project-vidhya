---
id: trace.mnemonic
concept_id: trace
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"The diagonal's tally is the eigenvalues' total."** Two completely different-looking quantities — a sum you can read off by eye, and a sum of roots of a degree-$n$ polynomial — are the same number:

$$\text{tr}(A) = \sum_i a_{ii} = \sum_i \lambda_i$$

That's why trace is the cheapest fact about a matrix you will ever get. Any question phrased "sum of the eigenvalues" is a *reading* question, not a computation.

**The power version, one step further:**

$$\text{tr}(A^k) = \sum_i \lambda_i^k$$

So $\text{tr}(A^2)$ gives you $\sum \lambda_i^2$ without touching the characteristic polynomial. Pair it with $\text{tr}(A)$ and you can often pin down eigenvalues with no factoring at all.

**The cyclic rule — think of a necklace.** $\text{tr}(ABC) = \text{tr}(BCA) = \text{tr}(CAB)$: you may **rotate** the beads, never **reshuffle** them. $\text{tr}(ACB)$ is a different number in general. For two matrices rotation is all there is, so $\text{tr}(AB) = \text{tr}(BA)$ always — even when $AB$ and $BA$ have different sizes.

**The one that is not true:** $\text{tr}(AB) \neq \text{tr}(A)\text{tr}(B)$. Trace is linear in *addition*, not in multiplication. Counterexample to keep handy: $A = \begin{pmatrix}1&2\\3&2\end{pmatrix}$, $B = \begin{pmatrix}2&0\\1&1\end{pmatrix}$ give $\text{tr}(A)\text{tr}(B) = 3 \cdot 3 = 9$ but $\text{tr}(AB) = 6$.
