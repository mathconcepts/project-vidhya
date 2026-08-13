---
id: ode-higher-order-intuition
concept_id: ode-higher-order
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

## Higher-Order Linear ODEs with Constant Coefficients

An $n$th-order linear ODE with constant coefficients:

$$a_n y^{(n)} + a_{n-1}y^{(n-1)} + \cdots + a_1 y' + a_0 y = 0$$

has a general solution that is a linear combination of $n$ independent solutions, each of the form $e^{rx}$ (or its modification). Finding those solutions requires only **solving one polynomial equation**.

---

### The Auxiliary (Characteristic) Equation

Substitute $y = e^{rx}$ to obtain:

$$a_n r^n + a_{n-1}r^{n-1} + \cdots + a_1 r + a_0 = 0$$

This degree-$n$ polynomial has exactly $n$ roots (counting multiplicity, over $\mathbb{C}$). Each root type contributes basis functions as follows:

| Root type | Basis functions contributed |
|---|---|
| Distinct real $r$ | $e^{rx}$ |
| Real root of multiplicity $m$ | $e^{rx},\; xe^{rx},\; x^2 e^{rx},\; \ldots,\; x^{m-1}e^{rx}$ |
| Complex pair $\alpha \pm i\beta$ (simple) | $e^{\alpha x}\cos(\beta x),\; e^{\alpha x}\sin(\beta x)$ |
| Complex pair of multiplicity $m$ | Each of the two real functions multiplied by $1, x, x^2, \ldots, x^{m-1}$ |

The **general solution** is always:

$$y = \sum_{k=1}^{n} C_k\, \phi_k(x)$$

where $\{\phi_k\}$ are the $n$ basis functions assembled from the table above.

---

### Why Repeated Roots Produce $x^k e^{rx}$

If $r$ is a double root, two trial solutions $e^{rx}$ are the same function — they cannot form an independent pair. The **reduction-of-order** argument shows that $xe^{rx}$ is also a solution, providing the needed second independent function.

---

**GATE focus.** The exam typically tests:
- Writing the auxiliary equation from the ODE.
- Factoring or recognising the roots (integer roots are common).
- Assembling $y_h$ correctly for each root type, especially repeated and complex cases.
- For non-homogeneous versions: appending $y_p$ found by undetermined coefficients or operator methods.
