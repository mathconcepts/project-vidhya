---
id: jordan-normal-form.visual_analogy
concept_id: jordan-normal-form
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

A diagonalizable matrix with eigenvalue $\lambda$ just scales by $\lambda^n$ under repeated multiplication — clean exponential growth, nothing else. A Jordan block hides an extra term. For $J=\begin{pmatrix}2&1\\0&2\end{pmatrix}$, the off-diagonal entry of $J^n$ works out to $n\cdot2^{n-1}$ — not a pure power of $2$, but $n$ *times* a power of $2$.

That polynomial-times-exponential shape is the signature of a genuine chain: the generalized eigenvector keeps picking up a fresh contribution from the eigenvector on every application, and the contributions accumulate instead of just compounding. The bars below are that entry at $n=1$ through $n=5$ — watch how fast it outruns pure exponential growth.

```gif-scene
{"type": "discrete-bars", "values": [1, 4, 12, 32, 80], "labels": ["n=1", "n=2", "n=3", "n=4", "n=5"]}
```
