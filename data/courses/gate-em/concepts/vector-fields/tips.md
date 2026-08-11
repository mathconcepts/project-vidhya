# Teaching Tips: Vector Fields

## Common Student Errors

- **Confusing vector and scalar fields**: Students often treat vector fields as scalar functions. Remember: $\mathbf{F}: \mathbb{R}^3 \to \mathbb{R}^3$ (input: point, output: vector). A scalar field $f: \mathbb{R}^3 \to \mathbb{R}$ (input: point, output: number).

- **Forgetting the constant of integration**: When reconstructing a potential function $f$ from $\nabla f = \mathbf{F}$, always add $+ C$ at the end. Different integration steps may produce different intermediate constants that must be reconciled carefully.

- **Misapplying the conservative test**: Students check $\frac{\partial P}{\partial y} = \frac{\partial Q}{\partial x}$ in 2D but forget to extend it to 3D (all three mixed-partial conditions must hold). A field that passes the 2D test on a subset is not necessarily conservative in 3D.

## GATE Question Pattern

Vector-field questions typically appear as: (1) Identify whether a given field is conservative (2–3 marks), (2) Reconstruct a potential function from components (2–3 marks), or (3) Use a conservative field to simplify a line-integral calculation (1–2 marks). The trap: presenting a field with mixed partial derivatives that almost look like they satisfy the conservative condition, but one fails. GATE loves testing whether you check *all* conditions.

## Speed Tricks for MCQs

- **Quick conservative test**: Write down $\frac{\partial P}{\partial y}$, $\frac{\partial Q}{\partial x}$, $\frac{\partial P}{\partial z}$, $\frac{\partial R}{\partial x}$, $\frac{\partial Q}{\partial z}$, $\frac{\partial R}{\partial y}$ side-by-side. If any pair differs, the field is not conservative—move on. Only if all six are equal do you attempt to find $f$.

- **Potential-function shortcut**: Once you confirm conservativeness, integrate $P$ w.r.t. $x$ (treating $y, z$ as constants), then take $\partial/\partial y$ of the result and compare with $Q$ to find the $y$-dependent part. This is faster than formal integration of all three components.

- **Direction and magnitude check**: Before diving into calculus, verify that the field direction is consistent with its formula at a test point (e.g., $(1, 0)$). A quick vector sketch catches sign errors immediately.

## Must-Memorize Formulas / Results

**Conservative field criterion (2D):**
$$\frac{\partial P}{\partial y} = \frac{\partial Q}{\partial x}$$

**Conservative field criterion (3D):**
$$\nabla \times \mathbf{F} = \mathbf{0} \quad \text{(curl of a gradient is always zero)}$$

**Potential function definition:**
$$\mathbf{F} = \nabla f = \left(\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}, \frac{\partial f}{\partial z}\right)$$

**Line integral of a conservative field:**
$$\int_C \mathbf{F} \cdot d\mathbf{r} = f(B) - f(A)$$
where $A$ and $B$ are the endpoints (path-independent).

**Gradient of common functions:**
- $\nabla(x^2 + y^2 + z^2) = 2x\mathbf{i} + 2y\mathbf{j} + 2z\mathbf{k}$
- $\nabla(e^{xyz}) = yze^{xyz}\mathbf{i} + xze^{xyz}\mathbf{j} + xye^{xyz}\mathbf{k}$
- $\nabla(\ln(x^2 + y^2)) = \frac{2x}{x^2+y^2}\mathbf{i} + \frac{2y}{x^2+y^2}\mathbf{j}$
