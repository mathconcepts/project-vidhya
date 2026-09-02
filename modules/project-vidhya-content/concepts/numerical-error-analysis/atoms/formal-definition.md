---
id: numerical-error-analysis.formal-definition
concept_id: numerical-error-analysis
atom_type: formal_definition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
---

**Absolute error**: $E_a=|x_t-x_a|$. **Relative error**: $E_r=E_a/|x_t|$ ($x_t\neq0$). **Percentage error**: $E_p=E_r\times100\%$.

**Rounding error**: from representing a value with finitely many digits. **Truncation error**: from stopping an infinite or iterative process after finitely many steps — a different, algorithmic source, not a representation limit.

**Propagation**: addition/subtraction — $E_a(x\pm y)\le\delta x+\delta y$; multiplication/division — $E_r(xy)\approx E_r(x)+E_r(y)$, likewise for $x/y$.

**Method Selector.** Use relative error (not absolute) when comparing measurements across very different scales — a $0.2$ cm gap is negligible on a $25$ m span but enormous on a $25$ cm one, so "which measurement is more precise?" is really asking you to compare relative, not absolute, error. Absolute error is the tempting default because it's the raw number you actually computed, but it carries no information about scale on its own.
