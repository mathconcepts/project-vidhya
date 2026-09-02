---
id: rank-nullity.intuition
concept_id: rank-nullity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

When a matrix $A$ acts on vectors, two things happen: some information survives, and some disappears.

**Rank** is the number of linearly independent rows (equivalently, columns) — how many dimensions of output the matrix actually produces. If $A$ is $3\times3$ with rank 2, every output lies in a 2-dimensional subspace no matter what goes in.

**Nullity** is the dimension of the null space — vectors that map to zero. It measures the lost degrees of freedom: every direction in the null space is "silent," carrying no signal through.

The **Rank-Nullity Theorem** connects them:

$$\text{rank}(A) + \text{nullity}(A) = n$$

where $n$ is the number of columns. The dimensions kept (rank) plus the dimensions lost (nullity) sum to the original input space size.

**Why it matters for GATE:** rank determines solvability of $A\mathbf{x}=\mathbf{b}$; full rank ($\text{rank}=n$) means invertible; rank-nullity gives the free-variable count immediately; it links row reduction, linear independence, and system consistency into one fact.

Add more independent rows and rank grows while nullity shrinks — they are opposites that must always balance to $n$.
