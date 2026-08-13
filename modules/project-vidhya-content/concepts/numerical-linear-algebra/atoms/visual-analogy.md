---
id: numerical-linear-algebra-visual-analogy
concept_id: numerical-linear-algebra
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Solving a Puzzle, Row by Row

Imagine you have $n$ interlocking puzzle pieces, where each piece represents one equation in the system $Ax = b$. Each piece "involves" several unknown variables — the pieces interlock because the unknowns are shared.

---

## Gaussian Elimination = Disassembling the Puzzle Systematically

**Step 1 — Isolate one variable in the first equation.** Pick the equation with the largest coefficient for $x_1$ (partial pivoting). Use it to *eliminate* $x_1$ from every other equation — you're peeling off one layer of interlocking.

**Step 2 — Repeat for $x_2$ among the remaining equations.** Each step removes one unknown from the system until you have a puzzle that looks like:

$$\begin{pmatrix} \blacksquare & * & * \\ 0 & \blacksquare & * \\ 0 & 0 & \blacksquare \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \\ x_3 \end{pmatrix} = \begin{pmatrix} c_1 \\ c_2 \\ c_3 \end{pmatrix}$$

**Step 3 — Back-substitution.** The last equation has only $x_3$. Solve it. Plug back to get $x_2$. Plug both back to get $x_1$. Puzzle solved.

---

## LU Decomposition = Saving Your Disassembly Instructions

Gaussian elimination as above solves *one* puzzle. But what if the same puzzle frame appears again with a different background picture ($b$ changes, $A$ stays the same)?

LU decomposition records the disassembly steps (multipliers) in a matrix $L$, and the final shape in $U$:

$$A = \underbrace{L}_{\text{disassembly log}} \cdot \underbrace{U}_{\text{simplified frame}}$$

Next time you get a new right-hand side, you only need $O(n^2)$ work (forward + back substitution) rather than re-doing $O(n^3)$ disassembly.

---

## Iterative Methods = Successive Approximation

For a giant puzzle (millions of pieces, most with only a few connections), the full disassembly is prohibitively expensive. Instead:

1. Make a wild guess at the solution: $x^{(0)}$.
2. "Jiggle" each piece individually using the current best guesses of its neighbours.
3. Repeat until the pieces stop moving.

**Jacobi:** All pieces jiggle simultaneously, using the *same* old snapshot.

**Gauss-Seidel:** Each piece jiggles using the *freshest* available neighbors — slightly faster convergence because information propagates within an iteration.

Both converge when each piece is *tightly coupled to itself* and only loosely coupled to others — the diagonal dominance condition.

---

## Visual: Damped Oscillation Converging

The gif below shows a damped sinusoidal signal — a visual metaphor for Gauss-Seidel iterations spiraling toward a fixed point. Each oscillation is smaller than the last, just as iterative refinement shrinks the residual each sweep.

```gif-scene
{
  "type": "function-trace",
  "expression": "exp(-x * 0.5) * sin(4*x)",
  "x_range": [0, 8],
  "y_range": [-1.5, 1.5],
  "label": "Iteration envelope: residual decays geometrically each sweep"
}
```

---

## Condition Number = Puzzle Sensitivity

A **well-conditioned** puzzle: nudge one piece by 1 mm → the whole picture shifts by $\approx 1$ mm. Robust.

An **ill-conditioned** puzzle: nudge one piece by 1 mm → the whole picture shifts by 1 meter. Catastrophic sensitivity.

$$\kappa(A) = \|A\| \cdot \|A^{-1}\|$$

| $\kappa$ | Puzzle analogy |
|---|---|
| $\kappa \approx 1$ | Rigid frame — perturbations don't propagate |
| $\kappa \sim 10^6$ | Loose frame — tiny wobble collapses everything |
| $\kappa = \infty$ | Singular — no unique solution exists |

---

## Analogy Map

| Puzzle analogy | Linear algebra concept |
|---|---|
| Puzzle pieces | Equations in $Ax = b$ |
| Interlocking (shared unknowns) | Off-diagonal entries |
| Disassembly procedure | Gaussian elimination |
| Disassembly log | Lower triangular matrix $L$ |
| Simplified frame | Upper triangular matrix $U$ |
| Successive jiggling | Jacobi / Gauss-Seidel iteration |
| Puzzle rigidity | Condition number $\kappa(A)$ |
