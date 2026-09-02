---
id: ode-second-order-nonhomo.formal-definition
concept_id: ode-second-order-nonhomo
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Second-order non-homogeneous linear ODE, constant coefficients**:
$$a\,y''+b\,y'+c\,y=f(x),\qquad f(x)\not\equiv0$$

**General solution**: $y(x)=y_h(x)+y_p(x)$, where $y_h$ solves $ay''+by'+cy=0$ (carries the two arbitrary constants) and $y_p$ is any one solution of the full equation.

**Undetermined coefficients**: guess $y_p$'s form to match $f(x)$'s family (polynomial, exponential, sine/cosine, or a product), solve for the coefficients by substitution. If the guessed form already solves the homogeneous equation, multiply the whole trial by $x$ (or $x^2$ for a repeated root).

**Variation of parameters**: with homogeneous solutions $y_1,y_2$ and Wronskian $W=y_1y_2'-y_2y_1'$, a particular solution is
$$y_p=-y_1\int\frac{y_2f(x)}{W}\,dx+y_2\int\frac{y_1f(x)}{W}\,dx$$

**Method selector.** Reach for undetermined coefficients when $f(x)$ belongs to a *finite* family closed under differentiation (polynomials, $e^{kx}$, $\sin/\cos(kx)$, and their products). A tempting-but-wrong move is guessing a polynomial-exponential trial for $f(x)=\sec x$ or $f(x)=\dfrac1x$: repeated differentiation of $\sec x$ never closes into a finite list of terms to match coefficients against, so no trial form exists — variation of parameters, which only needs $f(x)$ to be integrable against $y_1,y_2$, is the method that actually applies.
