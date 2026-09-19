---
id: vectors-jee.common-traps
concept_id: vectors-jee
atom_type: common_traps
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
tested_by_atom: vectors-jee.micro-exercise
---

- **Order in the cross product**: $\vec a\times\vec b=-(\vec b\times\vec a)$. Swap the order and the answer flips sign — it does not become the same vector. Always compute in the order the question gives the vectors.

- **Dot product is a number, not a vector.** $\vec a\cdot\vec b$ has no direction and no $\hat i,\hat j,\hat k$ in it. Writing $\vec a\cdot\vec b=(4,-2,1)$ or similar means the cross product formula was used by mistake, or a stray component was left in.

- **Cyclic swaps in a triple product are free, non-cyclic swaps are not.** $[\vec a\ \vec b\ \vec c]=[\vec b\ \vec c\ \vec a]=[\vec c\ \vec a\ \vec b]$ — rotating the three vectors changes nothing. But swapping any **two** of them, like $[\vec b\ \vec a\ \vec c]$, flips the sign. Students treat all six orderings as interchangeable; only the three cyclic ones are.

- **$\cos\theta$ needs the magnitudes in the denominator.** $\vec a\cdot\vec b$ alone is not $\cos\theta$ — it has to be divided by $|\vec a||\vec b|$ first. Skipping that step and reading $\vec a\cdot\vec b$ itself as "the cosine" gives a number that is not even bounded between $-1$ and $1$.

- **Zero triple product means coplanar, not pairwise parallel.** $[\vec a\ \vec b\ \vec c]=0$ says the three vectors lie in one plane. It does not say any two of them point the same way — three vectors at completely different angles can still be coplanar.
