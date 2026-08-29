---
id: systems-of-equations.exam-pattern
concept_id: systems-of-equations
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **The dominant pattern is the parameter question:** *"for what value of $k$ does the system have no solution / infinitely many solutions?"* You are not being asked to solve it. Work in two stages:

  1. **$\det(A) = 0$** finds the values of $k$ where uniqueness can fail. Nothing else can produce a non-unique answer.
  2. **Then test consistency** at each such $k$ — that is what separates "no solution" from "infinitely many".

  Skipping stage 2 is the single most common lost mark on this pattern.

- **Worked instance.** For
  $$x + y + z = 1, \quad x + 2y + 4z = k, \quad x + 4y + 10z = k^2$$
  the coefficient determinant is $\begin{vmatrix} 1&1&1\\1&2&4\\1&4&10\end{vmatrix} = 1(20-16) - 1(10-4) + 1(4-2) = 0$ for *every* $k$ — so a unique solution is impossible, whatever $k$ is. Stage 2: $R_2 - R_1$ and $R_3 - R_1$, then $R_3 - 3R_2$ leaves the last row as $0\ 0\ 0 \mid k^2 - 3k + 2 = (k-1)(k-2)$. Consistent only when $k = 1$ or $k = 2$ (infinitely many solutions); **no solution for every other $k$** (verified by rank: $\text{rank}(A) = 2$ throughout, while $\text{rank}([A\mid b]) = 3$ at $k = 0$ and $k = 3$, and $2$ at $k = 1, 2$).

- **MCQ "how many solutions" questions want ranks, not solutions.** Row-reduce $[A \mid b]$, count non-zero rows, stop. Back-substituting to find $x, y, z$ you were never asked for costs 2–3 minutes for zero marks.

- **Traps GATE sets:**
  - Offering "exactly two solutions" as an option. Impossible for a linear system.
  - A homogeneous system with more unknowns than equations ($m < n$): it *always* has a non-trivial solution, since $\text{rank}(A) \leq m < n$. No computation required.
  - $\det(A) = 0$ read as "no solution". It means *not unique* — could still be infinitely many.

- **Time budget:** a $3\times3$ integer system should take about 90 seconds to echelon form. Decide from the ranks and move on unless the question explicitly asks for the values of the unknowns.
