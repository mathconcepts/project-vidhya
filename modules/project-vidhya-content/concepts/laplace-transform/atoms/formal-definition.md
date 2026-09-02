---
id: laplace-transform.formal-definition
concept_id: laplace-transform
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**The Laplace Transform**: For a time-domain function $f(t)$ defined for $t \geq 0$, the Laplace transform is:

$$\mathcal{L}\{f(t)\} = F(s) = \int_0^\infty e^{-st} f(t) \, dt$$

where $s = \sigma + j\omega$ is the complex frequency variable. The integral converges for $\text{Re}(s) > \sigma_c$ (the region of convergence).

**Geometric interpretation**: Each factor $e^{-st}$ in the integrand is a rotating exponential decay in the complex plane. The real part $\sigma$ controls decay rate; the imaginary part $\omega$ controls rotation. As $s$ varies, different decay–rotation pairs are weighted by $f(t)$.

**When to reach for it:** use the Laplace transform when a problem hands you a linear, constant-coefficient ODE with numerical initial conditions — those conditions fold directly into $\mathcal{L}\{y'\}$ and $\mathcal{L}\{y''\}$ during the transform step itself. Don't reach for the (real) Fourier series on a problem that looks periodic but also carries initial conditions: the Fourier series describes an already-settled periodic steady state and has no term for $y(0)$ or $y'(0)$ to fold into.
