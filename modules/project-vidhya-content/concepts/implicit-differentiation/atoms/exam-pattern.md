---
id: implicit-differentiation.exam-pattern
concept_id: implicit-differentiation
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions give a curve and a point on it, and ask for the tangent slope there** — the point is chosen to satisfy the equation exactly, so the first quiet check is confirming the point actually lies on the curve before differentiating anything.

  Example: for $x^2 - y^2 = 16$ at $(5,3)$ — check first: $25-9=16$ ✓. Differentiating, $2x - 2y\dfrac{dy}{dx}=0$, so $\dfrac{dy}{dx}=\dfrac{x}{y}$. At $(5,3)$: slope $=\dfrac{5}{3}$.

- **MCQ options isolate the one forgotten factor.** The standard distractor set has the correct answer alongside the same expression with the $\dfrac{dy}{dx}$ factor silently dropped from a $y$-term, and the same expression with a sign flipped after isolating $\dfrac{dy}{dx}$.

- **Related-rates questions are implicit differentiation with respect to time** instead of $x$ — the mechanics (chain rule on every changing quantity) are identical, only the independent variable's name changes.

- **Time budget:** a one-variable implicit differentiation with a clean point should take about a minute — most of it verifying the point lies on the curve and isolating $\dfrac{dy}{dx}$ cleanly, not the differentiation itself.
