---
id: sequences.common_traps
concept_id: sequences
atom_type: common_traps
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
---

**Trap 1 — "Bounded" is read as "convergent."** $a_n=(-1)^n$ is bounded ($-1\le a_n\le 1$) and diverges anyway — it just alternates forever. Boundedness alone guarantees nothing; it has to be paired with monotonicity (or another argument) to force convergence.

**Trap 2 — Solving $L=f(L)$ before checking convergence exists.** For a recursively defined $a_{n+1}=f(a_n)$, plugging in a guessed limit $L$ and solving $L=f(L)$ can return a real number even when the sequence itself diverges or oscillates. The equation only identifies a *candidate* limit — the Monotone Convergence Theorem (or an equivalent argument) has to confirm convergence first.

**Trap 3 — Confusing the sequence with its running total.** $a_n$ is one term; $S_n=a_1+\cdots+a_n$ is a different sequence built from it. "$a_n\to 0$" and "$S_n$ converges" are not the same statement — the terms shrinking to zero is necessary for the sum to converge, never sufficient on its own.
