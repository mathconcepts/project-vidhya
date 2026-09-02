---
id: improper-integrals.formal_definition
concept_id: improper-integrals
atom_type: formal_definition
bloom_level: 2
difficulty: 0.45
exam_ids: ["*"]
---

**Improper integral (two types).**
$$
\text{Type I: } \int_a^\infty f(x)\,dx=\lim_{N\to\infty}\int_a^N f(x)\,dx,\qquad
\text{Type II: } \int_a^b f(x)\,dx=\lim_{\varepsilon\to0^+}\int_{a+\varepsilon}^b f(x)\,dx
$$
(Type II shown for a blow-up at $x=a$; an interior singularity is split into two pieces, each treated separately.) The integral **converges** when the limit is a finite number and **diverges** otherwise — including diverging to $\pm\infty$ or oscillating.

**$p$-integral test.** $\int_1^\infty x^{-p}\,dx$ converges iff $p>1$; $\int_0^1 x^{-p}\,dx$ converges iff $p<1$ — the direction reverses between the two.

Use the direct limit definition whenever the antiderivative is elementary; reach for the $p$-test to classify convergence fast, not to find the value. The tempting-but-wrong move is applying the Fundamental Theorem straight across an infinite or undefined endpoint — writing $[F(x)]_a^\infty$ as if $\infty$ were an ordinary number to substitute — which can silently produce a finite-looking answer even when the true limit does not exist.
