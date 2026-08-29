---
id: orthogonality.mnemonic
concept_id: orthogonality
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Ortho-gonal" = "right-angled"** (Greek *orthos*, straight/right + *gonia*, angle). The definition $\mathbf{u} \cdot \mathbf{v} = 0$ is just the right angle written arithmetically — that's the whole idea in one word.

**The payoff worth memorizing: transpose *is* the inverse.**

$$Q^T Q = I \iff Q^{-1} = Q^T$$

Every time a problem hands you an orthogonal matrix, you have been handed a free inverse. Never row-reduce to invert a $Q$.

**Checking a matrix is orthogonal — check columns, not $Q^{-1}$:**

- Each column has length 1
- Every pair of columns dots to 0

That's $n$ norms and $\binom{n}{2}$ dot products, all cheap. For a $2\times2$ it's three tiny computations.

**Sanity-check reflex:** $\det(Q) = \pm 1$ for every orthogonal $Q$ (from $\det(Q)^2 = \det(Q^TQ) = 1$). If your candidate has $\det = 2$, stop — it is not orthogonal. But the converse fails: $\det = \pm 1$ alone proves nothing, so use it only to *disqualify*, never to confirm.
