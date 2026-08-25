---
id: numerical-error-analysis.retrieval-prompt
concept_id: numerical-error-analysis
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
estimated_minutes: 3
---

A number $x = 0.034207$ is rounded to 4 significant figures, giving $0.03421$. What is the relative error, and what type of error does this represent?

- **(A)** Relative error $\approx 8.8 \times 10^{-5}$; this is rounding error
- **(B)** Relative error $\approx 8.8 \times 10^{-5}$; this is truncation error
- **(C)** Relative error $\approx 8.8 \times 10^{-3}$; this is rounding error
- **(D)** Relative error $\approx 3 \times 10^{-6}$; this is truncation error

<details>
<summary>Answer</summary>

**A**. First find the absolute error:

$$E_a = |0.034207 - 0.03421| = 0.000003 = 3\times10^{-6}$$

Then the relative error:

$$E_r = \frac{3\times10^{-6}}{0.034207} \approx 8.77\times10^{-5} \approx \boxed{8.8\times10^{-5}}$$

As for the type: the value was obtained by **rounding** to a fixed number of significant figures (keeping the nearest representable 4-significant-figure value) — this is a representation limit, so it's **rounding error**, not truncation error. Truncation error would apply if, say, an infinite series or iterative process had been cut short after a fixed number of terms/steps — a different situation from simply rounding a single number's digits.

B) has the right magnitude but the wrong error type — rounding to a fixed number of significant figures is rounding, not truncation.

C) and D) both have the relative-error magnitude wrong: C) is off by two orders of magnitude (likely from forgetting to divide the absolute error by the true value before converting to a percentage-like fraction), and D) reports the *absolute* error's magnitude as if it were the relative error.

The correct answer is A.

</details>
