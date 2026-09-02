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

- **NAT dimension questions are pure recall plus one subtraction.** $\dim P_n = n+1$; $\dim M_{m\times n} = mn$; symmetric $n\times n$ is $\frac{n(n+1)}{2}$; skew-symmetric is $\frac{n(n-1)}{2}$. For a subspace cut out by independent homogeneous equations, $\dim W = n - (\text{number of independent equations})$.

  Example: $W = \{(x,y,z) : x-2y+z=0\}$ is the null space of the $1\times3$ matrix $[1\ {-2}\ 1]$, rank $1$, so $\dim W = 3-1=2$ — a plane through the origin.

- **The trap GATE returns to: union vs intersection.** The **intersection** of two subspaces is always a subspace; the **union** almost never is. In $\mathbb{R}^2$, the $x$-axis and $y$-axis are each subspaces, but $(1,0)+(0,1)=(1,1)$ lies in neither, so the union isn't closed under addition.

- **The other trap: "closed under addition, therefore a subspace."** Closure under addition alone is not enough — the first quadrant is closed under addition and contains $\mathbf{0}$, but $-1\cdot(1,1)=(-1,-1)$ escapes it. Scaling includes **negative** scalars.

- **Time budget:** each option in a subspace MSQ should cost about 30 seconds — if one is taking longer, you've probably started proving closure for a set that already failed the zero test.
