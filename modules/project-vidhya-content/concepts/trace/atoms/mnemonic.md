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

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag both eigenvalues — every power trace falls out for free",
  "why": "tr(Aᵏ) is just the eigenvalues raised to the k-th power and added up — no characteristic polynomial needed. Drag λ1 and λ2 and watch tr(A), tr(A²), tr(A³) update together, all from the same two numbers.",
  "inputs": [
    {"id": "l1", "label": "λ1", "min": -5, "max": 5, "step": 0.5, "initial": 2},
    {"id": "l2", "label": "λ2", "min": -5, "max": 5, "step": 0.5, "initial": 3}
  ],
  "outputs": [
    {"label": "tr(A) = λ1 + λ2", "formula": "l1 + l2", "digits": 2},
    {"label": "tr(A²) = λ1² + λ2²", "formula": "l1^2 + l2^2", "digits": 2},
    {"label": "tr(A³) = λ1³ + λ2³", "formula": "l1^3 + l2^3", "digits": 2}
  ],
  "caption": "Every one of these three numbers is a reading question about λ1 and λ2, never a computation on A itself. Try λ1 = −λ2: tr(A) drops to zero but tr(A²) doesn't — odd powers cancel, even powers never do."
}
```
