---
id: continuity.formal-definition
concept_id: continuity
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Continuity at a Point**: A function $f$ is continuous at $x = a$ if:
1. $f(a)$ is defined
2. $\lim_{x \to a} f(x)$ exists
3. $\lim_{x \to a} f(x) = f(a)$

**Continuity on an Interval**: $f$ is continuous on $(a,b)$ if it is continuous at every point in the interval. $f$ is continuous on the **closed interval** $[a,b]$ if it is continuous on $(a,b)$ and the one-sided limits at the endpoints equal the function values: $\lim_{x \to a^+} f(x) = f(a)$ and $\lim_{x \to b^-} f(x) = f(b)$.

**Types of Discontinuity:**
- **Removable discontinuity:** $\lim_{x \to a} f(x)$ exists but $\neq f(a)$ (or $f(a)$ undefined).
- **Jump discontinuity:** $\lim_{x \to a^-} f(x) \neq \lim_{x \to a^+} f(x)$.
- **Infinite discontinuity:** $\lim_{x \to a} f(x) = \pm \infty$.
