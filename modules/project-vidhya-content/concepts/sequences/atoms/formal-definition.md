---
id: sequences.formal_definition
concept_id: sequences
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Convergence of a sequence.** A sequence $(a_n)$ **converges** to $L$ if for every $\epsilon>0$ there exists $N\in\mathbb{N}$ such that $|a_n-L|<\epsilon$ for all $n>N$. We write $\lim_{n\to\infty}a_n=L$. If no such $L$ exists, $(a_n)$ **diverges**.

$(a_n)$ is **bounded** if $|a_n|\le M$ for some $M$ and all $n$; it is **monotonic** if it is non-decreasing throughout, or non-increasing throughout.

**Monotone Convergence Theorem:** every bounded monotonic sequence converges.

**Method selector:** reach for the Monotone Convergence Theorem when boundedness and monotonicity are both easy to show but the limit's exact value is hard to name directly (a recursively defined sequence, say) — not the raw $\epsilon$–$N$ definition, which some students try to invoke from scratch even when monotonicity is the faster route; the theorem proves a limit *exists* without ever computing it.
