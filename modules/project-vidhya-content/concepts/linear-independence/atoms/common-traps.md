---
id: linear-independence.common-traps
concept_id: linear-independence
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Confusing "linearly independent" with "not equal."** Two vectors can look totally different — different numbers, not equal — and still be linearly dependent, as long as one is a scalar multiple of the other (meaning: one is just the other stretched or shrunk by some number). Example: $\begin{pmatrix} 1 \\ 2 \end{pmatrix}$ and $\begin{pmatrix} 3 \\ 6 \end{pmatrix}$ look different, but they're dependent — the second is simply 3 times the first, pointing in the exact same direction.

**Trap 2: Assuming the number of vectors equals dimension means independence.** Having more vectors than the dimension guarantees dependence, never independence. Take 5 vectors in $\mathbb{R}^3$ (3-dimensional space) — they can never all be independent, whatever they are. That's the pigeonhole principle: you can't fit more than $n$ independent "directions" into $n$-dimensional space, just as you can't fit 5 pigeons into 3 holes one each. A linearly independent set in $\mathbb{R}^n$ has at most $n$ vectors.

**Trap 3: Forgetting that the trivial solution ($\mathbf{c} = \mathbf{0}$) always exists.** The equation $c_1v_1 + c_2v_2 + \cdots = \mathbf{0}$ always has at least one solution — all $c_i=0$, called the trivial solution, since it works for literally any set of vectors. Linear independence means this trivial solution is the **only** one. Many students mistakenly think "independent = has a solution" and stop there — they forget to check whether some non-trivial (non-zero) combination also equals zero.

**Trap 4: Mixing up "span" and "basis."** Being independent doesn't mean a set covers the whole space. "Span" means every vector in the space can be built as a combination of your set; a set can be perfectly independent and still miss part of the space, leaving some vectors unreachable. A "basis" needs both properties together — independence AND full span. Independence alone is only half the job.

**Trap 5: Not accounting for zero vectors.** If a set contains the zero vector $\mathbf{0}$, it is automatically linearly dependent — no exceptions. Why? Because you can write $1 \cdot \mathbf{0} + 0 \cdot v_2 + \cdots = \mathbf{0}$ using a non-trivial coefficient (that 1 in front of $\mathbf{0}$), so the "only the trivial solution" rule from Trap 3 breaks immediately. This means the zero vector can never be part of a basis.