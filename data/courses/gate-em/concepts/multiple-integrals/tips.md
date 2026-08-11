# Teaching Tips: Multiple Integrals

## Common Student Errors

- **Forgetting order of integration:** Students compute $\int \int f(x,y) dx dy$ but forget to compute inner integral first.
- **Variable limits confusion:** When the region is not rectangular, limits of the inner integral depend on the outer variable.
- **Forgetting Jacobian in coordinate change:** When converting to polar, students forget $dA = r \, dr \, d\\theta$.

## GATE Question Pattern

GATE asks: (1) set up and evaluate double integrals (MCQ or NAT, 2 marks). (2) Convert to polar coordinates (2 marks). (3) Find volumes under surfaces (NAT).

## Speed Tricks for MCQs

- **Rectangle first:** For rectangular regions, order doesn't matter (Fubini).
- **Polar for circles:** If the region is circular or involves $x^2 + y^2$, use polar coordinates immediately.
- **Inner integral first:** Always compute the innermost integral (w.r.t. the innermost variable) first.

## Must-Memorize Formulas / Results

- **Fubini's Theorem:** $\\iint_R f(x,y) dA = \\int_a^b \\int_c^d f(x,y) dy \\, dx$
- **Change to polar:** $x = r\\cos(\\theta)$, $y = r\\sin(\\theta)$, $dA = r \\, dr \\, d\\theta$
- **Volume under surface:** $V = \\iint_R f(x,y) \\, dA$
