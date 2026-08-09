# Teaching Tips: Mean Value Theorems

## Common Student Errors

- **Forgetting to check all three conditions for Rolle's Theorem:** Students assume it applies without verifying continuity, differentiability, and $f(a) = f(b)$.
- **Confusing the conclusion:** MVT says $f'(c) = $ average slope, not that $f(c) = $ something.
- **Forgetting the open interval:** $c$ must be in the open interval $(a,b)$, not at the endpoints.

## GATE Question Pattern

GATE asks: (1) verify MVT/Rolle's conditions (MCQ), (2) find the point $c$ (NAT), (3) use MVT to prove an inequality (rare, 2-mark theory). Piecewise and absolute-value functions are used to test if students know when theorems fail.

## Speed Tricks for MCQs

- **Three conditions checklist:** For Rolle's: continuous? differentiable? $f(a) = f(b)$? For MVT: continuous? differentiable? That's it.
- **Absolute value fails:** $|x|$ fails differentiability at $x = 0$.
- **Linear functions:** For $f(x) = mx + b$, MVT is "obvious" — $f'(x) = m$ everywhere.

## Must-Memorize Formulas / Results

- **Rolle's Theorem:** If $f$ continuous on $[a,b]$, differentiable on $(a,b)$, and $f(a) = f(b)$, then $\exists c \in (a,b)$ with $f'(c) = 0$.
- **Mean Value Theorem:** If $f$ continuous on $[a,b]$, differentiable on $(a,b)$, then $\exists c \in (a,b)$ with $f'(c) = \frac{f(b) - f(a)}{b - a}$.
- **Consequence:** If $f'(x) = 0$ for all $x \in (a,b)$, then $f$ is constant on $(a,b)$.
