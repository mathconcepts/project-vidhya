---
id: systems-of-equations.mnemonic
concept_id: systems-of-equations
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**Two ranks decide everything.** For $Ax=b$ with $n$ unknowns, row-reduce $[A\mid b]$ once and read off both ranks:

> **Disagree → None. Agree and Full → One. Agree and Short → Infinite.**

- **Disagree** — $\text{rank}(A) < \text{rank}([A\mid b])$: **no** solution (a row reads $0\ 0\ 0 \mid c$ with $c \neq 0$ — you derived $0=c$).
- **Agree and Full** — both ranks $=n$: exactly **one** solution.
- **Agree and Short** — both ranks $=r<n$: **infinitely** many, with $n-r$ free parameters.

$$\text{free parameters} = n - \text{rank}(A)$$

That last line is rank–nullity in different clothes: the free parameters span $\ker(A)$, so the solution set is one particular solution plus the null space.

**Five-second reflexes:** $\text{rank}([A\mid b])$ is always $\text{rank}(A)$ or $\text{rank}(A)+1$ — only one question matters, *did adding $b$ raise the rank?* A **homogeneous** system ($b=0$) can never be inconsistent — $x=0$ always works. "Two solutions" is never an option; linear systems have $0$, $1$, or $\infty$.
