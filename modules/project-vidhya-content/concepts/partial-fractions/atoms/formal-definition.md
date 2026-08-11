---
id: partial-fractions.formal-definition
concept_id: partial-fractions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Partial Fraction Decomposition**: Express a rational function $\frac{P(x)}{Q(x)}$ as a sum of simpler fractions. If $Q(x)$ factors into linear terms $(x - a_1)(x - a_2)\cdots(x - a_n)$, then:
$$\frac{P(x)}{Q(x)} = \frac{A_1}{x - a_1} + \frac{A_2}{x - a_2} + \cdots + \frac{A_n}{x - a_n}$$

**Cases**:
- **Distinct linear factors**: $\frac{P(x)}{(x-a)(x-b)} = \frac{A}{x-a} + \frac{B}{x-b}$
- **Repeated linear factors**: $\frac{P(x)}{(x-a)^n}$ requires $\frac{A_1}{x-a} + \frac{A_2}{(x-a)^2} + \cdots + \frac{A_n}{(x-a)^n}$
- **Irreducible quadratic**: $\frac{P(x)}{(x^2 + px + q)}$ requires $\frac{Ax + B}{x^2 + px + q}$
