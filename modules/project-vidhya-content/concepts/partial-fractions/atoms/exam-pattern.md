---
id: partial-fractions.exam-pattern
concept_id: partial-fractions
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions often want one specific coefficient** (just $A$, or just $B$) rather than the full decomposition — cover-up gets there directly without solving a system, which is the whole point of using it under time pressure.

  Example: for $\dfrac{3x+5}{(x-1)(x+2)}$, the coefficient over $(x-1)$ is $A=\left.\dfrac{3x+5}{x+2}\right|_{x=1}=\dfrac83$ — read off in one substitution, with no need to also solve for $B$.

- **MCQ questions frequently test recognizing the right template** for a given denominator (repeated factor, irreducible quadratic) rather than doing the algebra — matching $\dfrac1{(x-2)^2(x+3)}$ to its three-term template is the actual skill being checked.

- **Partial fractions rarely stands alone** — it's almost always step one of a larger inverse-Laplace or integration problem, so the real time cost is downstream; a fast, correct decomposition here saves time on every later step.

- **Time budget:** cover-up on distinct linear factors should cost under 30 seconds per coefficient; clearing denominators and comparing coefficients is the slower fallback reserved for repeated or quadratic factors, not the default move.
