---
id: sequences-series.formal-definition
concept_id: sequences-series
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Arithmetic progression (AP)**: first term $a$, common difference $d$. $n$th term: $a_n = a+(n-1)d$. Sum of first $n$ terms: $S_n = \dfrac{n}{2}\big(2a+(n-1)d\big)$.

**Geometric progression (GP)**: first term $a$, common ratio $r$. $n$th term: $a_n = ar^{n-1}$. Sum of first $n$ terms (for $r \neq 1$): $S_n = \dfrac{a(r^n-1)}{r-1}$. Infinite sum, valid only for $|r|<1$: $S_\infty = \dfrac{a}{1-r}$.

**Harmonic progression (HP)**: a sequence whose reciprocals form an AP. There is no direct sum formula for an HP in general — convert to the AP of reciprocals, work there, then invert back at the end.

**Means of two positive numbers $a,b$**: $\text{AM}=\dfrac{a+b}{2}$, $\text{GM}=\sqrt{ab}$, $\text{HM}=\dfrac{2ab}{a+b}$. Always $\text{AM}\geq\text{GM}\geq\text{HM}$, with equality throughout exactly when $a=b$.

**Telescoping method**: if a general term $T_r$ can be written as $f(r)-f(r+1)$, then

$$\sum_{r=1}^{n}T_r = \big(f(1)-f(2)\big)+\big(f(2)-f(3)\big)+\cdots+\big(f(n)-f(n+1)\big) = f(1)-f(n+1)$$

**Method selector.** Given raw numbers with no visible pattern, check for a constant DIFFERENCE first (AP), then a constant RATIO (GP), and only then check whether the reciprocals form an AP (HP) — in that order, since an AP test is the cheapest to run. For a sum whose terms look like $\dfrac{1}{r(r+1)}$ or similar, look for a partial-fraction split into $f(r)-f(r+1)$ before attempting to force it into the AP or GP sum formulas, which do not apply to it at all.
