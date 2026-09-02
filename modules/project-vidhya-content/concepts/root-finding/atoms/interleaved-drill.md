---
id: root-finding.interleaved-drill
concept_id: root-finding
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: root-finding → numerical-error-analysis.**

Three Newton-Raphson iterations on $f(x)=x^3-x-1$ from $x_0=1.5$ give $x_3=1.3245$; the true root is $1.32472$.

**Q1.** What is the absolute error in $x_3$?
**A1.** $E_a=|1.32472-1.3245|=0.00022$.

**Q2.** What is the percentage error, and is that consistent with three steps of quadratic convergence starting from a residual of $0.875$?
**A2.** $E_r=0.00022/1.32472\approx0.000166$, so $E_p\approx0.017\%$ — consistent: the residual sequence $0.875\to0.1005\to0.0029$ was already shrinking by a widening factor each step, so a fourth-decimal-place error after three steps is exactly what quadratic convergence predicts, not a coincidence.

**Why this drill exists:** students report a converged iterate's *residual* $f(x_n)$ as if it were the *error* $|x_n-x^*|$ — the two are related but not identical, and only error-analysis vocabulary (absolute/relative error against a known or bounded true value) states precisely what "close enough" means for a stopping rule.
