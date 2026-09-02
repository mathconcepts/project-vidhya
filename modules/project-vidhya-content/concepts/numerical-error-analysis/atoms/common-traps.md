---
id: numerical-error-analysis.common-traps
concept_id: numerical-error-analysis
atom_type: common_traps
bloom_level: 2
difficulty: 0.22
exam_ids: ["*"]
---

**Trap 1 — Reporting absolute error as "the" error.** $|x_t-x_a|$ alone can't say whether an error is large or small — a $0.1$ gap is trivial on a value of $1000$ but enormous on a value of $0.5$.

**Trap 2 — Confusing rounding with truncation error.** Rounding comes from a representation limit (finitely many digits); truncation comes from an algorithmic limit (stopping an infinite or iterative process early). They have different causes and different fixes.

**Trap 3 — Assuming errors partially cancel.** Under worst-case analysis, absolute errors of a sum or difference **add**, even when subtracting two positive quantities — they never partially cancel just because the operation is a subtraction.

**Trap 4 — Forgetting division still adds relative errors.** $E_r(x/y)\approx E_r(x)+E_r(y)$, the same addition rule as multiplication — division does not "cancel out" error.
