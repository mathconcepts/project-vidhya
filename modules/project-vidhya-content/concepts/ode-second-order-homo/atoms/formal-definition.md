---
id: ode-second-order-homo.formal-definition
concept_id: ode-second-order-homo
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Second-order homogeneous linear ODE, constant coefficients**:
$$a\,y''+b\,y'+c\,y=0,\qquad a\neq0$$

**Characteristic equation**: substituting $y=e^{rx}$ reduces the ODE to $ar^2+br+c=0$.

**General solution**, by the discriminant $\Delta=b^2-4ac$ of that quadratic:

- $\Delta>0$ — distinct real roots $r_1\neq r_2$: $\;y=C_1e^{r_1x}+C_2e^{r_2x}$
- $\Delta=0$ — repeated root $r$: $\;y=(C_1+C_2x)e^{rx}$
- $\Delta<0$ — complex pair $\alpha\pm i\beta$: $\;y=e^{\alpha x}(C_1\cos\beta x+C_2\sin\beta x)$

In every case the solution space is two-dimensional; $C_1,C_2$ are fixed by two conditions (an IVP's $y(x_0),y'(x_0)$, or a BVP's two boundary values).

**Method selector.** Reach for the characteristic-equation method the instant the ODE is linear, homogeneous, and has *constant* coefficients — check that before writing $r^2$ for anything. A tempting-but-wrong move is applying it to $x^2y''-xy'+y=0$ (an Euler–Cauchy equation): the coefficients depend on $x$, so $e^{rx}$ is not an eigenfunction of this operator and $ar^2+br+c=0$ is simply the wrong algebra — Euler–Cauchy equations need the substitution $y=x^m$ instead, which turns *that* equation into its own auxiliary polynomial in $m$.
