---
id: product-quotient-rule.exam-pattern
concept_id: product-quotient-rule
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions evaluate the derivative of a product or quotient at a named point**, expecting a single simplified number rather than the unsimplified rule output.

  Example: for $y = \dfrac{x^2}{x+1}$, $y' = \dfrac{2x(x+1) - x^2}{(x+1)^2} = \dfrac{x^2+2x}{(x+1)^2}$. At $x=1$: $y'(1) = \dfrac{1+2}{4} = \dfrac{3}{4}$ — the fraction that should be entered, not the intermediate expanded formula.

- **MCQ distractors swap the order or drop the square.** The most common wrong options replace $u'v - uv'$ with $uv' - u'v$ (sign flipped throughout), or leave $[v(x)]^2$ as plain $v(x)$ in the denominator.

- **Combined product-then-quotient (or vice versa) questions test whether the correct rule is chosen for each layer**, since a single expression can have a quotient inside a product or a product inside a quotient — misidentifying the outermost structure is the usual failure point.

- **Time budget:** a single-application product or quotient question should take under ninety seconds; a combined one, up to two minutes — most of that time belongs to correctly identifying $u$ and $v$, not to the algebra afterward.
