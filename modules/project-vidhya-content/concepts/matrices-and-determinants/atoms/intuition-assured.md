---
id: matrices-and-determinants.intuition-assured
concept_id: matrices-and-determinants
atom_type: intuition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
variant_of: matrices-and-determinants.intuition
for_stance: assured
---

$\det(A)\neq0 \Leftrightarrow A^{-1}$ exists $\Leftrightarrow Ax=b$ has exactly one solution, via $A^{-1}=\frac1{\det(A)}\text{adj}(A)$. The condition worth being precise about: $\det(A)=0$ does NOT by itself tell you whether $Ax=b$ has infinitely many solutions or none — it only rules out a UNIQUE one. Counterexample pair, same coefficient matrix $A$ with $\det(A)=0$, two different right-hand sides: $x+2y=3,\ 2x+4y=6$ (second equation is exactly twice the first) has infinitely many solutions, since every point on the line $x+2y=3$ satisfies both. But $x+2y=3,\ 2x+4y=7$ — same $A$, $\det(A)=0$ still — has NO solution, since the left sides are proportional but the right sides are not. Singular $A$ alone never decides between these two outcomes; the right-hand side does.
