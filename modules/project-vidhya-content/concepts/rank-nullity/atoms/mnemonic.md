---
id: rank-nullity.mnemonic
concept_id: rank-nullity
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Every column is either a pivot or free."** Row-reduce $A$ and look along the columns. Each one carries a pivot or it does not — no third option, no column counted twice:

$$\underbrace{\#\text{pivot columns}}_{\text{rank}} + \underbrace{\#\text{free columns}}_{\text{nullity}} = \underbrace{n}_{\#\text{columns}}$$

That *is* the rank-nullity theorem — bookkeeping, not a result to memorize, so it can always be rebuilt if the formula slips.

**The one thing to actually memorize: $n$ is the number of *columns*.** Not rows, not $\min(m,n)$. Mnemonic: **the theorem lives in the domain.** For $A:\mathbb{R}^n\to\mathbb{R}^m$, rank and nullity split the $n$ input dimensions — the output space $\mathbb{R}^m$ never enters the equation.

**Free variables = parameters.** Nullity is literally how many parameters appear in the general solution of $A\mathbf{x}=\mathbf{0}$.

**Sanity-check reflex:** $\text{rank}(A) \le \min(m,n)$, always. A computed rank of 3 on a $2\times5$ matrix is an arithmetic error, not a surprising matrix.
