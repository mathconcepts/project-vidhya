---
id: rank-nullity.mnemonic
concept_id: rank-nullity
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Every column is either a pivot or free."**

Row-reduce $A$ and look along the columns. Each one either carries a pivot or it does not — there is no third option, and no column is counted twice. So:

$$\underbrace{\#\text{pivot columns}}_{\text{rank}} + \underbrace{\#\text{free columns}}_{\text{nullity}} = \underbrace{n}_{\#\text{columns}}$$

That *is* the rank-nullity theorem. It is bookkeeping, not a result to memorise — which means you can always rebuild it if the formula slips.

**The one thing to actually memorise: $n$ is the number of *columns*.** Not rows, not $\min(m,n)$, not the size of anything else. Mnemonic: **the theorem lives in the domain.** For $A: \mathbb{R}^n \to \mathbb{R}^m$, rank and nullity split the $n$ input dimensions — how much the map keeps, and how much it crushes to zero. The output space $\mathbb{R}^m$ never enters the equation.

**Free variables = parameters.** The nullity is literally how many parameters appear in the general solution of $A\mathbf{x} = \mathbf{0}$. Nullity 2 means a 2-parameter family.

**Sanity-check reflex:** $\text{rank}(A) \le \min(m, n)$, always. A computed rank of 3 on a $2\times5$ matrix is an arithmetic error, not a surprising matrix — go back before trusting the nullity you derived from it.
