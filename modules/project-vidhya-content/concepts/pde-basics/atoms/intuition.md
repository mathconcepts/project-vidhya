---
id: pde-basics-intuition
concept_id: pde-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

## Partial Differential Equations: The Core Ideas

A **PDE** involves an unknown function of two or more independent variables together with its partial derivatives. The three canonical second-order linear PDEs in the GATE syllabus each govern a different physical phenomenon:

| PDE | Name | Phenomenon |
|---|---|---|
| $u_{tt} = c^2 u_{xx}$ | Wave equation | Vibrating strings, sound |
| $u_t = \alpha\, u_{xx}$ | Heat equation | Diffusion, thermal conduction |
| $u_{xx} + u_{yy} = 0$ | Laplace equation | Steady-state temperature, electrostatics |

---

### Classification by Discriminant

For the general second-order PDE $Au_{xx} + Bu_{xy} + Cu_{yy} + \cdots = 0$, the **discriminant** $\Delta = B^2 - 4AC$ classifies the equation:

| $\Delta$ | Type | Canonical example |
|---|---|---|
| $\Delta < 0$ | **Elliptic** | Laplace $u_{xx} + u_{yy} = 0$ |
| $\Delta = 0$ | **Parabolic** | Heat $u_t = u_{xx}$ (treat $t$ as $y$) |
| $\Delta > 0$ | **Hyperbolic** | Wave $u_{tt} = c^2 u_{xx}$ |

---

### Key Vocabulary

- **Order**: the order of the highest partial derivative present.
- **Degree**: the power of the highest-order derivative (assuming the equation is polynomial in derivatives).
- **Linearity**: the unknown $u$ and all its derivatives appear to the first power with no products among them.

---

### Solution Strategy: Separation of Variables

For homogeneous PDEs with simple domains, write $u(x,t) = X(x)\,T(t)$ and substitute. The PDE splits into two ODEs — one in $X$, one in $T$ — connected by a separation constant $\lambda$. Boundary conditions fix the allowable $\lambda$ values (eigenvalues), and the general solution is a superposition (series).

---

**GATE focus**: computing the discriminant and classifying equations; applying separation of variables to the heat or wave equation on $[0,L]$; recognising which PDE type admits unique solutions with which boundary-data specifications (Dirichlet, Neumann, mixed).
