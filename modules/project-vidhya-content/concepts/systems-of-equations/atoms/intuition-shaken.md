---
# Alternative body for systems-of-equations-intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `systems-of-equations-intuition` (no dot),
# a legacy naming drift check-content-integrity.ts tolerates. variant_of
# points at that exact id; this file's own id follows the normal convention
# instead of propagating the drift.
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
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: systems-of-equations-intuition
for_stance: shaken
---

## Try a concrete system first

$$x+y=5, \qquad 2x-y=1$$

From the first equation, $y=5-x$. Substitute into the second: $2x-(5-x)=1 \Rightarrow 3x=6 \Rightarrow x=2,\ y=3$. One equation is one line; two equations are two lines; they cross at exactly one point, $(2,3)$.

## When does a solution exist at all?

$A\mathbf{x}=\mathbf{b}$ has a solution exactly when $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])$ — the augmented matrix carries no "new" information the coefficient matrix lacks. That single statement is the whole consistency theorem.

## Three outcomes, by rank

| Condition | Solutions |
|---|---|
| ranks differ | zero — inconsistent |
| ranks equal, $=n$ | exactly one |
| ranks equal, $<n$ | infinitely many |

Free variables $= n - \text{rank}(A)$.

## Two ways to solve

**Row reduction:** reduce $[A\mid\mathbf{b}]$ with row swaps, row scaling, and adding a multiple of one row to another. Then back-substitute.

**Cramer's rule** (square, $\det(A)\neq0$): $x_i=\det(A_i)/\det(A)$, where $A_i$ replaces column $i$ with $\mathbf{b}$. Fine for 2 or 3 unknowns.

## The homogeneous case

$A\mathbf{x}=\mathbf{0}$ always has $\mathbf{x}=\mathbf{0}$. It has other solutions exactly when $\text{rank}(A)<n$ — for square $A$, the same condition as $\det(A)=0$.

## What GATE actually asks

- Reduce to row echelon form to find rank — the most common sub-step
- Decide the number of solutions from ranks alone
- Solve a $3\times3$ system inside a larger question
- Recognize $(A-\lambda I)\mathbf{x}=\mathbf{0}$ as a homogeneous system
