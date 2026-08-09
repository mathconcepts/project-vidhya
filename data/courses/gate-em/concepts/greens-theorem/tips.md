# Teaching Tips: Green's Theorem

## Common Student Errors

- **Wrong orientation of C**: Green's Theorem requires $C$ to be traversed **counterclockwise** (positive orientation). If the problem specifies clockwise, either reverse it (flipping the sign) or recompute. A clockwise circle negates the integral.

- **Confusing which partial derivative goes where**: The formula is $\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}$, not the reverse. Reversing the subtraction flips the sign of the answer—a common 1-mark mistake.

- **Forgetting to compute the area**: Many GATE problems give a closed region (circle, ellipse, triangle) and ask to "evaluate $\oint_C P \, dx + Q \, dy$" expecting you to use Green's Theorem. A novice tries to parameterize the curve; an expert recognizes "closed curve" and immediately computes the double integral of curl over the enclosed region.

## GATE Question Pattern

Green's Theorem questions split into: (1) **Direct application** (2 marks): "Use Green's Theorem to evaluate $\oint_C ...$" — identify $P$, $Q$, compute curl, integrate. (2) **Area via Green's Theorem** (2 marks): "Find the area enclosed by $C$" using $A = \frac{1}{2}\oint_C x \, dy - y \, dx$ or $A = \oint_C x \, dy$. (3) **Conservative field recognition** (1 mark): "Is this line integral zero?" — check if $\frac{\partial Q}{\partial x} = \frac{\partial P}{\partial y}$ (curl = 0 ⟹ integral = 0 for closed curves).

## Speed Tricks for MCQs

- **Curl inspection shortcut**: Before substituting into Green's Theorem, compute $\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}$ on scratch paper. If it simplifies to a constant $k$, the integral is $k \times \text{(area of region)}$—no need to expand the double integral.

- **Area formulas in your head**: Common areas: circle $r^2 = R^2$ → $\pi R^2$; ellipse $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$ → $\pi ab$; triangle with vertices $(0,0), (a, 0), (0, b)$ → $\frac{ab}{2}$.

- **Conservative-field litmus test**: For any closed $C$, if $\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y} = 0$ everywhere, the line integral is 0 instantly (no parameterization, no double integral).

## Must-Memorize Formulas / Results

**Green's Theorem (Circulation-Curl Form):**
$$\\oint_C P \\, dx + Q \\, dy = \\iint_D \\left(\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right) dA$$

**Green's Theorem (Flux-Divergence Form):**
$$\\oint_C P \\, dy - Q \\, dx = \\iint_D \\left(\\frac{\\partial P}{\\partial x} + \\frac{\\partial Q}{\\partial y}\\right) dA$$

**Area enclosed by $C$ (Green's formula):**
$$A = \\frac{1}{2} \\oint_C x \\, dy - y \\, dx = \\oint_C x \\, dy = -\\oint_C y \\, dx$$

**Key identities:**
- Zero curl ⟹ zero circulation: If $\\frac{\\partial Q}{\\partial x} = \\frac{\\partial P}{\\partial y}$, then $\\oint_C P \\, dx + Q \\, dy = 0$.
- Conservative field ⟹ independent of path: $\\mathbf{F} = \\nabla f$ implies $\\oint_C \\mathbf{F} \\cdot d\\mathbf{r} = 0$ for closed $C$.

**Common curves (for quick area calculation):**
- Disk $x^2 + y^2 \\leq R^2$: area $= \\pi R^2$
- Ellipse $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} \\leq 1$: area $= \\pi ab$
- Triangle with base $b$, height $h$: area $= \\frac{1}{2}bh$
