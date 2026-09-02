---
id: numerical-linear-algebra.visual-analogy
concept_id: numerical-linear-algebra
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Picture $n$ interlocking equations as puzzle pieces sharing unknowns. Gaussian elimination disassembles the puzzle systematically: isolate $x_1$ using the row with the largest coefficient, use it to remove $x_1$ from every other row, then repeat for $x_2$ among what's left, until only back-substitution remains.

LU decomposition just writes down the disassembly log as you go: $L$ records the multipliers used at each step, $U$ is the simplified final shape. Get a new right-hand side later — same puzzle frame, different picture — and only $O(n^2)$ work (forward + back substitution) is needed instead of $O(n^3)$ disassembly all over again.

There is no honest 2-D picture for how sensitive a solution is to perturbation — condition number is a property of the whole matrix, not a curve — but the number itself says everything: $\kappa(A)\approx1$ means nudging one piece by a millimeter shifts the whole picture by about a millimeter; $\kappa(A)\sim10^6$ means the same millimeter nudge can collapse the entire assembly.
