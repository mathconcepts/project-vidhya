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

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag both ranks — watch the classification fall out",
  "why": "Two ranks decide everything about a linear system. Drag rank(A) and rank([A|b]) and watch the rank gap flag inconsistency, while the free-parameter count tells you exactly how many dimensions of solutions remain.",
  "inputs": [
    {"id": "n", "label": "unknowns n", "min": 2, "max": 6, "step": 1, "initial": 4},
    {"id": "rankA", "label": "rank(A)", "min": 0, "max": 6, "step": 1, "initial": 3},
    {"id": "rankAb", "label": "rank([A|b])", "min": 0, "max": 6, "step": 1, "initial": 3}
  ],
  "outputs": [
    {"label": "rank gap = rank([A|b]) − rank(A)", "formula": "rankAb - rankA", "digits": 0},
    {"label": "free parameters = n − rank(A)", "formula": "n - rankA", "digits": 0}
  ],
  "caption": "Rank gap 0 means Agree; nonzero means Disagree → no solution, full stop (the free-parameter count stops mattering). With Agree, free parameters 0 means exactly one solution; anything above 0 is that many dimensions of infinitely many."
}
```
