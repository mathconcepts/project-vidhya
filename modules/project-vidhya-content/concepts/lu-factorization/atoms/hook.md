---
id: lu-factorization.hook
concept_id: lu-factorization
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

# LU Factorization: The Two-Step Matrix Recipe

Many engineering systems require solving $Ax = b$ **multiple times** with the same matrix $A$ but different right-hand sides $b$. Computing the inverse $A^{-1}$ is expensive; LU factorization offers a smarter path: decompose $A = LU$ once, then reuse it.
