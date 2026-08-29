---
id: systems-of-equations.mnemonic
concept_id: systems-of-equations
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**Two ranks decide everything. Compare them, then compare to $n$.**

For $Ax = b$ with $n$ unknowns, row-reduce the augmented matrix $[A \mid b]$ once and read off both ranks. Then:

> **Disagree → None. Agree and Full → One. Agree and Short → Infinite.**

- **Disagree** — $\text{rank}(A) < \text{rank}([A\mid b])$: **no** solution. (A row read $0\ 0\ 0 \mid c$ with $c \neq 0$ — you derived $0 = c$.)
- **Agree and Full** — both ranks $= n$: exactly **one** solution.
- **Agree and Short** — both ranks $= r < n$: **infinitely** many, with $n - r$ free parameters.

$$\text{number of free parameters} = n - \text{rank}(A)$$

That last line *is* rank–nullity wearing different clothes: the free parameters are a basis for $\ker(A)$, so the solution set is one particular solution plus the null space.

**The five-second reflexes:**

- $\text{rank}([A\mid b])$ is always $\text{rank}(A)$ or $\text{rank}(A)+1$ — never more. Only two cases exist, so only one question matters: *did adding $b$ raise the rank?*
- A **homogeneous** system ($b = 0$) can never be inconsistent — $x = 0$ always works. The only question left is "one or infinitely many", answered by $\text{rank}(A)$ vs $n$ alone.
- "Two solutions" is never an option. Linear systems have $0$, $1$, or $\infty$ — if a distractor says two, it's wrong on sight.
