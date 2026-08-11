# PDE Basics
> GATE Engineering Mathematics | Differential Equations | medium frequency | difficulty: 0.7

## Intuition First
A partial differential equation involves derivatives with respect to multiple independent variables. Where an ODE describes a single curve evolving in time (or space), a PDE describes a surface or field evolving in time AND space simultaneously. Heat diffusing through a rod, waves on a string, or electric fields in space—all are PDEs.

## Core Definition
**Partial Differential Equation (PDE)** Standard form involves at least two independent variables (e.g., $x$ and $t$) and partial derivatives:
$$F\left(x, t, u, \frac{\partial u}{\partial x}, \frac{\partial u}{\partial t}, \frac{\partial^2 u}{\partial x^2}, \ldots \right) = 0$$

**Order**: The highest derivative order appearing in the PDE.

**Linearity**: A PDE is linear if $u$ and its partial derivatives appear to the first power only (no products, no $u^2$, etc.).

**Three canonical PDEs** (most common in GATE):
1. **Heat (Diffusion) Equation** (parabolic): $\frac{\partial u}{\partial t} = k \frac{\partial^2 u}{\partial x^2}$
2. **Wave Equation** (hyperbolic): $\frac{\partial^2 u}{\partial t^2} = c^2 \frac{\partial^2 u}{\partial x^2}$
3. **Laplace Equation** (elliptic): $\frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} = 0$ (steady-state)

**Method of Separation of Variables** (most practical for GATE):
Assume $u(x, t) = X(x) T(t)$ (a product), substitute into the PDE, and separate it into two ODEs:
$$\frac{1}{X} \frac{d^2 X}{dx^2} = \frac{1}{kT} \frac{dT}{dt} = -\lambda$$ (a separation constant)

Each ODE can then be solved independently using ODE techniques.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider the heat equation on a rod of length $L$ with insulated ends: $\frac{\partial u}{\partial t} = k \frac{\partial^2 u}{\partial x^2}$ with boundary conditions $\frac{\partial u}{\partial x}(0, t) = 0$ and $\frac{\partial u}{\partial x}(L, t) = 0$ (insulated ends), and initial condition $u(x, 0) = f(x)$.

**Step 1:** Assume separation: $u(x, t) = X(x)T(t)$.

**Step 2:** Compute partial derivatives:
$$\frac{\partial u}{\partial t} = X(x) T'(t)$$
$$\frac{\partial^2 u}{\partial x^2} = X''(x) T(t)$$

**Step 3:** Substitute into the PDE:
$$X(x) T'(t) = k X''(x) T(t)$$

**Step 4:** Divide both sides by $X(x)T(t)$:
$$\frac{T'(t)}{kT(t)} = \frac{X''(x)}{X(x)}$$

Since the left side depends only on $t$ and the right side depends only on $x$, both must equal a constant (the separation constant, denoted $-\lambda$):
$$\frac{T'(t)}{kT(t)} = -\lambda \quad \Rightarrow \quad T'(t) + k\lambda T(t) = 0$$
$$\frac{X''(x)}{X(x)} = -\lambda \quad \Rightarrow \quad X''(x) + \lambda X(x) = 0$$

**Step 5:** Solve the spatial ODE $X''(x) + \lambda X(x) = 0$ with boundary conditions $X'(0) = 0$ and $X'(L) = 0$.

The characteristic equation is $r^2 + \lambda = 0$, giving $r = \pm i\sqrt{\lambda}$ (assuming $\lambda > 0$).

General solution: $X(x) = A\cos(\sqrt{\lambda} x) + B\sin(\sqrt{\lambda} x)$.

Apply $X'(0) = 0$: $-A\sqrt{\lambda} \sin(0) + B\sqrt{\lambda} \cos(0) = 0 \Rightarrow B = 0$.

So $X(x) = A\cos(\sqrt{\lambda} x)$.

Apply $X'(L) = 0$: $-A\sqrt{\lambda} \sin(\sqrt{\lambda} L) = 0$.

For non-trivial solutions ($A \neq 0$): $\sin(\sqrt{\lambda} L) = 0 \Rightarrow \sqrt{\lambda} L = n\pi$ where $n = 0, 1, 2, \ldots$

**Eigenvalues:** $\lambda_n = \left(\frac{n\pi}{L}\right)^2$

**Eigenfunctions:** $X_n(x) = \cos\left(\frac{n\pi x}{L}\right)$

**Step 6:** Solve the temporal ODE $T'(t) + k\lambda_n T(t) = 0$:
$$T_n(t) = C_n e^{-k\lambda_n t} = C_n \exp\left(-k\frac{n^2\pi^2}{L^2} t\right)$$

**Step 7:** Superposition: The general solution is a sum of all separable solutions:
$$u(x, t) = \sum_{n=0}^{\infty} C_n \cos\left(\frac{n\pi x}{L}\right) \exp\left(-k\frac{n^2\pi^2}{L^2} t\right)$$

The coefficients $C_n$ are determined from the initial condition $u(x, 0) = f(x)$ using Fourier cosine series.

**Geometric interpretation:** The solution is a superposition of modes. Each mode $\cos\left(\frac{n\pi x}{L}\right)$ decays exponentially in time at a rate proportional to $n^2$. Higher-frequency spatial modes (larger $n$) decay faster—this is a hallmark of diffusive (heat) processes.

Label: "**Why it works:**"
Separation of variables exploits the linearity and the special structure of the PDE. By assuming a product form $u = X(x)T(t)$, we convert the PDE (involving both $x$ and $t$) into two independent ODEs (one in $x$ alone, one in $t$ alone). Each ODE can then be solved with standard techniques, and the full PDE solution is assembled by superposition. Boundary conditions constrain the eigenfunctions, and initial conditions constrain the time coefficients.

## GATE MA Relevance
> **Why it matters in GATE MA:** PDE basics account for ~5-8% of GATE MA questions (2-4 marks). Questions typically ask you to: (1) classify a PDE (order, linearity, type), (2) apply separation of variables to a heat or wave equation with given boundary conditions, or (3) write the form of the solution without computing the full Fourier series. GATE rarely expects a complete solution; instead, they test your understanding of the method and recognition of eigenvalues/eigenfunctions. A common trick: recognizing when a problem should use sine vs. cosine eigenfunctions (depends on boundary conditions).
