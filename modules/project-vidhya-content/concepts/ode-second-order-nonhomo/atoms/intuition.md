---
id: ode-second-order-nonhomo-intuition
concept_id: ode-second-order-nonhomo
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

## Second-Order Non-Homogeneous ODEs: Structure of the Solution

The general second-order linear non-homogeneous ODE is:

$$y'' + p(x)\,y' + q(x)\,y = f(x)$$

**The fundamental structure theorem** says that the general solution is always:

$$\boxed{y = y_h + y_p}$$

where $y_h$ is the **complementary (homogeneous) solution** and $y_p$ is any **particular integral**.

---

### The Complementary Function $y_h$

Solve $y'' + py' + qy = 0$ using the **characteristic equation**:

$$r^2 + pr + q = 0$$

| Roots | $y_h$ |
|---|---|
| Two distinct real $r_1, r_2$ | $C_1 e^{r_1 x} + C_2 e^{r_2 x}$ |
| Repeated real $r_1 = r_2 = r$ | $(C_1 + C_2 x)\,e^{rx}$ |
| Complex $r = \alpha \pm i\beta$ | $e^{\alpha x}(C_1\cos\beta x + C_2\sin\beta x)$ |

---

### The Particular Integral $y_p$

**Method of undetermined coefficients** (constant-coefficient ODEs, structured $f$):

| $f(x)$ | Trial $y_p$ |
|---|---|
| $e^{ax}$ | $Ae^{ax}$ (use $Axe^{ax}$ if $a$ is a root) |
| $\sin(bx)$ or $\cos(bx)$ | $A\cos(bx) + B\sin(bx)$ |
| Polynomial $x^n$ | $A_n x^n + \cdots + A_0$ |
| Product (e.g. $e^{ax}\sin(bx)$) | Product of the corresponding trials |

**Variation of parameters** works for any $f(x)$ when $y_h$ is known:

$$y_p = -y_1\int\frac{y_2 f}{W}\,dx + y_2\int\frac{y_1 f}{W}\,dx$$

where $W = y_1 y_2' - y_2 y_1'$ is the **Wronskian**.

---

**Key insight.** The homogeneous solution captures the system's *natural* behaviour (decay, oscillation). The particular integral captures the *forced* response. The two are independent — adding them satisfies the full equation by linearity.
