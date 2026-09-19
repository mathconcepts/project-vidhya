---
id: sequences-series.common-traps
concept_id: sequences-series
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: sequences-series.micro-exercise
---

**Trap 1 — Using the arithmetic mean where the harmonic mean applies.** Whenever equal DISTANCES (not equal times) are covered at different speeds, the average speed is the harmonic mean of the speeds, not their arithmetic mean. Averaging $60$ and $40$ as $50$ instead of computing the harmonic mean $48$ is the single most common version of this mistake.

**Trap 2 — Forgetting the GP sum formula's restriction $r \neq 1$.** $S_n=\dfrac{a(r^n-1)}{r-1}$ divides by $r-1$, which is undefined at $r=1$. A GP with $r=1$ is just a constant sequence repeated $n$ times, and its sum is simply $na$ — plugging $r=1$ into the formula directly gives $0/0$, not the right answer.

**Trap 3 — Using the infinite GP sum formula when $|r|\geq1$.** $S_\infty=\dfrac{a}{1-r}$ only converges when $|r|<1$. For $r=2$ or $r=-1$, the terms never shrink toward zero, the sum has no finite value, and writing down $\frac{a}{1-r}$ anyway produces a number that means nothing.

**Trap 4 — Applying AM-GM-HM to numbers that aren't all positive.** The chain $\text{AM}\geq\text{GM}\geq\text{HM}$ is proved for positive numbers only. Include a negative number in the set and the inequality can fail outright, not just weaken.

**Trap 5 — Miscounting how far a telescoping sum runs.** For $\displaystyle\sum_{r=1}^{n}\big(f(r)-f(r+1)\big)$, the surviving terms are $f(1)$ and $-f(n+1)$ — the second index is $n+1$, one more than the upper limit of the sum, since the last bracket generated is $f(n)-f(n+1)$. Reading the surviving index as $f(n)$ instead of $f(n+1)$ is an easy slip.
