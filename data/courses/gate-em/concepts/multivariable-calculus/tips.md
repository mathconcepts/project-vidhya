# Teaching Tips: Multivariable Calculus

## Common Student Errors

- **Mixing partial with total derivative:** $\frac{\partial f}{\partial x}$ treats other variables as constant; $df/dt$ chains through all variables.
- **Forgetting chain rule factors:** When computing $\frac{dz}{dt}$, students forget to multiply by $dx/dt$ or $dy/dt$.
- **Second partial notation:** Students confuse $\frac{\partial^2 f}{\partial x^2}$ (second w.r.t. x) with $\frac{\partial^2 f}{\partial x \partial y}$ (mixed).

## GATE Question Pattern

GATE asks: (1) compute $\frac{\partial f}{\partial x}$ or $\frac{\partial f}{\partial y}$ (MCQ), (2) find critical points (NAT, 2 marks), (3) apply chain rule (NAT, 2 marks).

## Speed Tricks for MCQs

- **Treat as constant:** When computing $\frac{\partial f}{\partial x}$, pretend $y$ (and all other variables) are constants.
- **Power rule applies:** All the derivative rules (power, product, chain) work on partials.
- **Chain rule pattern:** $\frac{dz}{dt} = \frac{\partial z}{\partial x} \frac{dx}{dt} + \frac{\partial z}{\partial y} \frac{dy}{dt}$.

## Must-Memorize Formulas / Results

- **Partial derivative definition:** $\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h, y) - f(x, y)}{h}$
- **Gradient:** $\\nabla f = (\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y})$
- **Multivariable chain rule:** $\\frac{dz}{dt} = \\frac{\\partial z}{\\partial x}\\frac{dx}{dt} + \\frac{\\partial z}{\\partial y}\\frac{dy}{dt}$
- **Schwarz's theorem:** If mixed partials are continuous, $\\frac{\\partial^2 f}{\\partial x \\partial y} = \\frac{\\partial^2 f}{\\partial y \\partial x}$.
