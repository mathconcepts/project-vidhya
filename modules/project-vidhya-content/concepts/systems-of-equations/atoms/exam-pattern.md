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

- **The dominant pattern is the parameter question:** *"for what value of $k$ does the system have no solution / infinitely many solutions?"* You are not being asked to solve it. Work in two stages: (1) $\det(A)=0$ finds the values of $k$ where uniqueness can fail; (2) test consistency at each such $k$ — that's what separates "no solution" from "infinitely many." Skipping stage 2 is the single most common lost mark on this pattern.

- **Worked instance.** For $x+y+z=1$, $x+2y+4z=k$, $x+4y+10z=k^2$, the coefficient determinant $\begin{vmatrix}1&1&1\\1&2&4\\1&4&10\end{vmatrix}=0$ for *every* $k$ — a unique solution is impossible regardless of $k$. Stage 2 (elimination) leaves the last row as $0\ 0\ 0 \mid k^2-3k+2=(k-1)(k-2)$: consistent only at $k=1$ or $k=2$ (infinitely many); **no solution** for every other $k$.

- **MCQ "how many solutions" questions want ranks, not solutions.** Row-reduce $[A\mid b]$, count non-zero rows, stop.

- **Traps GATE sets:** offering "exactly two solutions" as an option (impossible for a linear system); a homogeneous system with more unknowns than equations ($m<n$) *always* has a non-trivial solution, since $\text{rank}(A)\le m<n$; $\det(A)=0$ read as "no solution" when it only means "not unique."

- **Time budget:** a $3\times3$ integer system should take about 90 seconds to echelon form. Decide from the ranks and move on unless values are explicitly asked for.
