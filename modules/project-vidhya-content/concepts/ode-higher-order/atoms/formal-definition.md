---
id: ode-higher-order.formal-definition
concept_id: ode-higher-order
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

**$n$-th order linear ODE, constant coefficients, homogeneous**:
$$a_n\frac{d^ny}{dx^n}+a_{n-1}\frac{d^{n-1}y}{dx^{n-1}}+\cdots+a_1\frac{dy}{dx}+a_0y=0$$

**Auxiliary (characteristic) equation**: substituting $y=e^{rx}$ gives
$$a_nr^n+a_{n-1}r^{n-1}+\cdots+a_1r+a_0=0$$

**General solution** combines every root's contribution:
- Real root $r$, multiplicity $m$: $(C_1+C_2x+\cdots+C_mx^{m-1})e^{rx}$
- Complex pair $\alpha\pm i\beta$, multiplicity $m$: $e^{\alpha x}\big[(A_1+\cdots+A_mx^{m-1})\cos\beta x+(B_1+\cdots+B_mx^{m-1})\sin\beta x\big]$

The total number of arbitrary constants across all contributions always equals $n$.

**Method selector.** Reach for the auxiliary-equation method the moment the ODE is linear, homogeneous, and *constant*-coefficient, at any order. A tempting-but-wrong move is applying it to an Euler–Cauchy equation like $x^3y'''+x^2y''-2xy'+2y=0$: the coefficients depend on $x$, so $e^{rx}$ is not an eigenfunction of this operator regardless of order, and $a_nr^n+\cdots=0$ is the wrong algebra entirely — the substitution $y=x^m$ is what turns *that* family into its own polynomial in $m$.
