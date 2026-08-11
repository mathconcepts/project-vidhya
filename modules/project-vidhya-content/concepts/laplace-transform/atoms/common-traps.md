---
id: laplace-transform.common-traps
concept_id: laplace-transform
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting the region of convergence (ROC):** Students compute $F(s)$ but ignore Re$(s) > \sigma_c$. In GATE problems, the ROC is often part of the answer and distinguishes between left-sided, right-sided, and two-sided signals.
- **Confusing shift/translation rules:** Time-shift ($f(t-a)$) gives $e^{-as}F(s)$, while frequency-shift ($e^{-at}f(t)$) gives $F(s+a)$. Mixing these is a classic error. Remember: **time delays multiply by exponential in $s$; frequency shifts add to the pole.**
- **Polynomial numerator errors:** For $\mathcal{L}\{t^n f(t)\}$, the rule is $(-1)^n \frac{d^n}{ds^n} F(s)$, not simple multiplication. Many students incorrectly multiply by $t^n$ directly in the $s$-domain.
