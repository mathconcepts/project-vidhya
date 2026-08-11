# Teaching Tips: PDE Basics

## Common Student Errors
- **Confusing PDEs with ODEs:** Many students try to integrate a PDE as if it were an ODE, missing the fact that derivatives are partial (with respect to different variables). Always identify all independent variables first.
- **Forgetting that separation assumes a product form:** The method $u(x,t) = X(x)T(t)$ is an assumption, not a general solution. It works for linear PDEs with certain boundary conditions. Non-separable PDEs or non-homogeneous boundary conditions require different approaches.
- **Boundary vs. initial conditions confusion:** Boundary conditions (e.g., $u(0,t) = 0$) constrain the spatial part and determine eigenvalues. Initial conditions (e.g., $u(x, 0) = f(x)$) constrain the temporal part and determine time coefficients. Mixing these up breaks the method.

## GATE Question Pattern
GATE PDE questions focus on the **method of separation of variables** for the three canonical equations (heat, wave, Laplace). The typical question structure is: (1) classify the PDE, (2) apply separation to get two ODEs, (3) identify the correct eigenfunction form based on boundary conditions (sine vs. cosine, which $n$ values), or (4) write the form of the general solution. GATE does NOT expect you to compute the full Fourier series coefficients—that's too tedious. The trick is recognizing which boundary conditions lead to sine vs. cosine eigenfunctions: Dirichlet ($u=0$ on boundary) → sine; Neumann ($\frac{\partial u}{\partial n}=0$) → cosine; mixed → combination.

## Speed Tricks for MCQs
- **Eigenfunction recognition shortcut:** For Dirichlet boundary conditions ($u(0)=0, u(L)=0$), the eigenfunctions are sines: $\sin(n\pi x/L)$. For Neumann ($u'(0)=0, u'(L)=0$), they're cosines: $\cos(n\pi x/L)$. Memorize this—it saves time every time.
- **PDE type classification:** Heat → parabolic (first-order time, second-order space). Wave → hyperbolic (second-order time and space). Laplace → elliptic (second-order space, no time). Scan the PDE for these patterns instantly.
- **Separation constant sign:** In $\frac{X''(x)}{X(x)} = -\lambda$, the negative sign is standard. If the left side is positive (growing exponential), you need $\lambda < 0$, leading to exponential spatial solutions, not oscillatory. But GATE problems almost always use $\lambda > 0$, yielding oscillatory eigenfunctions.

## Must-Memorize Formulas / Results
- **Canonical PDE types:**
  - Heat: $\frac{\partial u}{\partial t} = k\frac{\partial^2 u}{\partial x^2}$ (parabolic)
  - Wave: $\frac{\partial^2 u}{\partial t^2} = c^2 \frac{\partial^2 u}{\partial x^2}$ (hyperbolic)
  - Laplace: $\nabla^2 u = 0$ or $\frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} = 0$ (elliptic)
- **Separation of variables setup:**
  1. Assume $u(x,t) = X(x)T(t)$
  2. Substitute into the PDE
  3. Rearrange to $\frac{\text{terms in } T}{T} = \frac{\text{terms in } X}{X} = \text{const} = -\lambda$
  4. Solve two independent ODEs using boundary + initial conditions
- **Eigenvalue equations (Dirichlet on $[0,L]$):** $X''(x) + \lambda X(x) = 0$ with $X(0)=X(L)=0$ gives $\lambda_n = (n\pi/L)^2$ and $X_n(x) = \sin(n\pi x/L)$ for $n=1,2,3,\ldots$
- **Heat equation temporal solution:** $T_n(t) = C_n e^{-k\lambda_n t}$ (exponential decay)
- **Wave equation temporal solution:** $T_n(t) = A_n\cos(c\sqrt{\lambda_n}t) + B_n\sin(c\sqrt{\lambda_n}t)$ (oscillation)
- **Superposition (general solution):** $u(x,t) = \sum_{n=1}^{\infty} T_n(t) X_n(x)$ where the series converges under appropriate regularity conditions.
- **Fourier series coefficients (for initial conditions $u(x,0)=f(x)$):**
  - Sine series: $c_n = \frac{2}{L}\int_0^L f(x)\sin(n\pi x/L) dx$
  - Cosine series: $c_n = \frac{2}{L}\int_0^L f(x)\cos(n\pi x/L) dx$ (plus $c_0/2$ term for $n=0$)
