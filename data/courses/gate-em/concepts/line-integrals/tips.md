# Teaching Tips: Line Integrals

## Common Student Errors

- **Forgetting to parameterize**: Students write $\int_C F_x dx + F_y dy$ and then try to integrate without substituting the parameterization. You *must* express $x(t), y(t), dx, dy$ in terms of $t$ before integrating.

- **Mixing up $\int_C f \, ds$ with $\int_C \mathbf{F} \cdot d\mathbf{r}$**: The first uses arc-length $ds = |\mathbf{r}'(t)| dt$ and is scalar (integrand is a number). The second uses the differential vector $d\mathbf{r} = \mathbf{r}'(t) dt$ and computes a dot product. Don't substitute one formula into the other problem.

- **Not checking conservativeness first**: Students laboriously compute $\int_C (3x^2) dx + (3y^2) dy$ along a complex path when they should notice $\nabla \times \mathbf{F} = 0$ and use the Fundamental Theorem in 10 seconds.

## GATE Question Pattern

Line-integral questions fall into two categories: (1) **Scalar integrals** ($\int_C f \, ds$): compute arc length and evaluate; often about average values along curves. (2) **Vector integrals** ($\int_C \mathbf{F} \cdot d\mathbf{r}$): test recognition of conservative fields and path independence. For closed curves, the trap is forgetting that *a conservative field's integral around a closed curve is always zero*. GATE frequently asks: "Calculate this line integral around a closed path"—the answer is 0 if the field is conservative.

## Speed Tricks for MCQs

- **Conservative test first**: Before parameterizing a 2D line integral, check $\frac{\partial Q}{\partial x} = \frac{\partial P}{\partial y}$. If true, find the potential and use endpoints—save 3–4 minutes.

- **Closed-curve shortcut**: For $\oint_C P \, dx + Q \, dy$ on a closed $C$, immediately check if $\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y} = 0$. If so, the answer is 0 (no parameterization needed).

- **Arc-length for simple curves**: If $C$ is a straight line from $(a_1, a_2)$ to $(b_1, b_2)$, the arc length is $\sqrt{(b_1-a_1)^2 + (b_2-a_2)^2}$ — use this directly instead of parameterizing.

## Must-Memorize Formulas / Results

**Vector line integral:**
$$\int_C \mathbf{F} \cdot d\mathbf{r} = \int_a^b \mathbf{F}(\mathbf{r}(t)) \cdot \mathbf{r}'(t) \, dt$$

**Scalar line integral (arc-length integral):**
$$\int_C f \, ds = \int_a^b f(\mathbf{r}(t)) |\mathbf{r}'(t)| \, dt$$

**Fundamental Theorem of Line Integrals:**
$$\int_C \nabla f \cdot d\mathbf{r} = f(B) - f(A)$$
where $A, B$ are endpoints (conservative field ⟹ path-independent).

**Closed-curve integral of conservative field:**
$$\oint_C \nabla f \cdot d\mathbf{r} = 0$$

**Green's Theorem (for scalar circulation):**
$$\oint_C P \, dx + Q \, dy = \iint_D \left(\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}\right) dA$$

**Arc-length formula for $y = f(x)$ from $x=a$ to $x=b$:**
$$L = \int_a^b \sqrt{1 + (f'(x))^2} \, dx$$

**Arc-length for parameterized curve $\mathbf{r}(t)$:**
$$L = \int_a^b |\mathbf{r}'(t)| \, dt$$
