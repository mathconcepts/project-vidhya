---
id: analytic-functions.exam-pattern
concept_id: analytic-functions
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want one value from a reconstructed conjugate** — given $u$ (or $v$), find the missing part at a specific point, not the whole function.

  Example: given $u=x^2-y^2$, find $v(1,2)$. Reconstruct $v=2xy+C$; taking $C=0$, $v(1,2)=2(1)(2)=4$ — a single number, not the full symbolic answer.

- **MCQ "which function is analytic" questions test the CR check itself**, usually against a short list including at least one function that looks smooth but fails CR (like $|z|^2$ or $\bar z$) as the designed distractor.

- **MSQ "which of the following are true" questions test consequences of analyticity**, not the definition directly:
  - Real and imaginary parts of an analytic function are each harmonic.
  - Harmonic conjugates' level curves are mutually orthogonal.
  - An analytic function is automatically infinitely differentiable.

- **Time budget:** a CR check on a given $u,v$ pair, or reconstructing a conjugate, should cost under 90 seconds — four partial derivatives and two comparisons, or one integration and one constant-fixing step. Longer than that usually means the harmonic pre-check (Trap: skipping $\nabla^2u=0$) was skipped and a doomed reconstruction was already underway.
