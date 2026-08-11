---
id: multiple-integrals.formal-definition
concept_id: multiple-integrals
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

**Double Integral** (over region $R$ in the $xy$-plane):
$$\iint_R f(x, y) \, dA = \int_a^b \int_{c(x)}^{d(x)} f(x, y) \, dy \, dx$$

**Iterated Integration**: Compute the inner integral first (with respect to $y$), then the outer integral (with respect to $x$).

**Fubini's Theorem**: For rectangular regions (or well-behaved regions), the order of integration can be swapped:
$$\int_a^b \int_c^d f(x, y) \, dy \, dx = \int_c^d \int_a^b f(x, y) \, dx \, dy$$
