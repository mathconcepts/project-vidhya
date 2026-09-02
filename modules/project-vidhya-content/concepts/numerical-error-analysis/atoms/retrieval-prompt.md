---
id: numerical-error-analysis.retrieval-prompt
concept_id: numerical-error-analysis
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["rounding-vs-truncation", "relative-error"]
---

Before checking, try to recall: $x=0.034207$ rounded to 4 significant figures gives $0.03421$. What is the relative error, and which type of error is this?

- **(A)** $\approx8.8\times10^{-5}$; rounding error
- **(B)** $\approx8.8\times10^{-5}$; truncation error
- **(C)** $\approx8.8\times10^{-3}$; rounding error
- **(D)** $\approx3\times10^{-6}$; truncation error

<details>
<summary>Answer</summary>

**A**. $E_a=|0.034207-0.03421|=3\times10^{-6}$. $E_r=3\times10^{-6}/0.034207\approx8.8\times10^{-5}$. It's **rounding error** — a representation limit (keeping the nearest 4-significant-figure value) — not truncation, which would apply to a cut-short infinite process instead.

</details>
