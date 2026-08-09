---
id: improper-integrals.formal-definition
concept_id: improper-integrals
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Type 1: Infinite Limits**:
$$\int_a^{\infty} f(x) \, dx = \lim_{t \to \infty} \int_a^t f(x) \, dx$$

$$\int_{-\infty}^b f(x) \, dx = \lim_{t \to -\infty} \int_t^b f(x) \, dx$$

**Type 2: Discontinuity at an Endpoint**:
$$\int_a^b f(x) \, dx = \lim_{\epsilon \to 0^+} \int_a^{b-\epsilon} f(x) \, dx \quad \text{(if discontinuous at } b \text{)}$$

**Convergence**: The improper integral converges if the limit exists and is finite. Otherwise it diverges.
