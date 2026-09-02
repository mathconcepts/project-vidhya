---
id: lu-factorization.hook
concept_id: lu-factorization
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

A linear system has a shape before you touch a single number. Gaussian elimination always zeroes out the same positions below the diagonal — a pattern fixed by which pivot clears which row, not by what the right-hand side happens to be. Freeze that shape once, as $A = LU$, and every future $b$ reuses it: two triangular solves instead of a full elimination. A structural-analysis system solving the same stiffness matrix against fifty different load cases is exploiting exactly this — the elimination runs once, not fifty times.
