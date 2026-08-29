---
id: vector-spaces.exam-pattern
concept_id: vector-spaces
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MSQ "which of the following are subspaces" is the signature format.** Four candidate sets, more than one correct. Sweep all four with the zero-vector test first — it typically eliminates half of them in under 20 seconds — then spend your closure argument only on the survivors.

- **NAT dimension questions are pure recall plus one subtraction.** $\dim P_n = n+1$; $\dim M_{m \times n} = mn$; symmetric $n \times n$ is $\frac{n(n+1)}{2}$; skew-symmetric is $\frac{n(n-1)}{2}$. For a subspace cut out by independent homogeneous equations, $\dim W = n - (\text{number of independent equations})$ — rank–nullity, in one line.

  Example: $W = \{(x,y,z) \in \mathbb{R}^3 : x - 2y + z = 0\}$ is the null space of the $1\times3$ matrix $[\,1\ \ {-2}\ \ 1\,]$, which has rank $1$, so $\dim W = 3 - 1 = 2$. A plane through the origin, as expected.

- **The trap GATE returns to: union vs intersection.** The **intersection** of two subspaces is always a subspace; the **union** almost never is. Kill it with one concrete counterexample: in $\mathbb{R}^2$, the $x$-axis and the $y$-axis are each subspaces, but $(1,0) + (0,1) = (1,1)$ lies in neither, so the union is not closed under addition. Memorise that example — it answers the question every time it appears.

- **The other trap: "$W$ is closed under addition, therefore a subspace."** Closure under addition alone is not enough. $\{(x,y) : x \geq 0,\ y \geq 0\}$ (the first quadrant) is closed under addition and contains $\mathbf{0}$, but $-1 \cdot (1,1) = (-1,-1)$ escapes it. Scaling includes **negative** scalars — that is the half of the test students skip.

- **Counting size vs counting independence.** "Do these $k$ vectors span $W$?" and "are they independent?" are different questions, and in a $d$-dimensional $W$ the arithmetic settles both edges for free: more than $d$ vectors can never be independent, fewer than $d$ can never span. See the paired drill.

- **Time budget:** each option in a subspace MSQ should cost about 30 seconds. If one is taking longer, you have probably started proving closure for a set that already failed the zero test.
