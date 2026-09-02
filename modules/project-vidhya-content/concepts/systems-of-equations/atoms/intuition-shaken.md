---
# Alternative body for systems-of-equations.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: systems-of-equations.intuition.shaken
concept_id: systems-of-equations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: systems-of-equations.intuition
for_stance: shaken
---

Try a concrete system first: $x+y=5$, $2x-y=1$. From the first, $y=5-x$. Substitute into the second: $2x-(5-x)=1 \Rightarrow 3x=6 \Rightarrow x=2,\ y=3$. One equation is one line; two equations are two lines; they cross at exactly one point, $(2,3)$.

When does a solution exist at all? $A\mathbf{x}=\mathbf{b}$ has one exactly when $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])$ — the augmented matrix carries no "new" information the coefficient matrix lacks.

| Condition | Solutions |
|---|---|
| ranks differ | zero — inconsistent |
| ranks equal, $=n$ | exactly one |
| ranks equal, $<n$ | infinitely many |

Free variables $= n - \text{rank}(A)$.

Two ways to solve: row reduction (swap, scale, or add a multiple of one row to another, then back-substitute), or Cramer's rule for square $\det(A)\neq0$ systems: $x_i=\det(A_i)/\det(A)$.

The homogeneous case: $A\mathbf{x}=\mathbf{0}$ always has $\mathbf{x}=\mathbf{0}$; other solutions exist exactly when $\text{rank}(A)<n$.

What GATE asks: reduce to row echelon form to find rank, decide the number of solutions from ranks alone, solve a $3\times3$ system inside a larger question, recognize $(A-\lambda I)\mathbf{x}=\mathbf{0}$ as homogeneous.
