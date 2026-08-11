---
id: limits.formal-definition
concept_id: limits
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Limit of a Function**: Let $f$ be defined in a neighborhood of $a$ (except possibly at $a$ itself). We say $\lim_{x \to a} f(x) = L$ if for every $\epsilon > 0$, there exists $\delta > 0$ such that $|f(x) - L| < \epsilon$ whenever $0 < |x - a| < \delta$.

**One-sided limits:**
- $\lim_{x \to a^+} f(x) = L$ (right limit): $x$ approaches $a$ from the right.
- $\lim_{x \to a^-} f(x) = L$ (left limit): $x$ approaches $a$ from the left.

The limit exists if and only if both one-sided limits exist and are equal.
