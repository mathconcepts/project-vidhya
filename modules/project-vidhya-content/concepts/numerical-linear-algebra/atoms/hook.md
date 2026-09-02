---
id: numerical-linear-algebra.hook
concept_id: numerical-linear-algebra
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Solving $Ax=b$ by pencil-and-paper Gaussian elimination is impractical once $A$ has thousands of rows — and pointless to redo from scratch every time only $b$ changes. Numerical linear algebra factors $A=LU$ once, then solves any number of right-hand sides cheaply by forward and back substitution alone. For enormous sparse systems, even that factorization is too costly, so iterative methods refine a guess instead of eliminating exactly — trading a guarantee for something that scales.
