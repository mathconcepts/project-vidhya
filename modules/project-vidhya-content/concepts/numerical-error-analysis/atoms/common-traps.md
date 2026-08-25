---
id: numerical-error-analysis.common-traps
concept_id: numerical-error-analysis
atom_type: common_traps
bloom_level: 2
difficulty: 0.22
exam_ids: ["*"]
---

- **Confusing absolute error with relative/percentage error:** reporting the raw difference $|x_t - x_a|$ as "the error" without normalizing by the true value makes it impossible to judge whether the error is actually large or small — a 0.1 error on a value of 1000 is trivial, but on a value of 0.5 it's enormous.
- **Confusing rounding error with truncation error:** rounding error comes from representing a number with finitely many digits (a representation limit); truncation error comes from stopping an infinite or iterative process early (an algorithmic limit, e.g., a truncated Taylor series). They have different causes and different fixes.
- **Assuming errors partially cancel when combining measurements:** under worst-case (and GATE) analysis, absolute errors of a sum or difference **add**, even when subtracting two positive quantities — they never subtract away just because the operation is a subtraction.
- **Forgetting that division still adds relative errors:** students sometimes expect division to "cancel out" error the way it can cancel common factors; instead, $E_r(x/y) \approx E_r(x) + E_r(y)$, exactly the same addition rule as for multiplication.
- **Miscounting significant figures:** treating leading zeros (as in $0.0034$) as significant, or assuming trailing zeros in a whole number like $1200$ are always significant — both are wrong without more context (e.g., a stated decimal point or scientific notation).
