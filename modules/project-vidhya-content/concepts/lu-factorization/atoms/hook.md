---
id: lu-factorization.hook
concept_id: lu-factorization
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Many engineering systems require solving $Ax = b$ **many times over** with the same matrix $A$ and a different right-hand side $b$ each time. Computing $A^{-1}$ for each is expensive and numerically careless. LU factorization takes the smarter path: decompose $A = LU$ once, then reuse it for every $b$ that arrives.
