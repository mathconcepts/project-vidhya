---
id: interpolation.interleaved-drill
concept_id: interpolation
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: interpolation → numerical-integration.**

Given $f(0)=1$, $f(1)=0.5$, $f(2)=1/3$ (samples of $f(x)=1/(1+x)$):

**Q1.** Find the quadratic interpolant's estimate for $f(0.5)$.
**A1.** The interpolating quadratic through the three points is $1-0.6667x+0.1667x^2$; at $x=0.5$ it gives $P(0.5)\approx0.7083$, against the true $f(0.5)=0.6667$ — a real gap, since $1/(1+x)$ curves away from any quadratic fit through only three points.

**Q2.** Integrate that SAME interpolating quadratic over $[0,2]$ — what do you get, and which numerical-integration rule does this reproduce exactly?
**A2.** $\int_0^2(1-0.6667x+0.1667x^2)\,dx=1.1111$ — which is precisely Simpson's 1/3 rule with $n=2$ applied to these three points, since Simpson's rule *is* "integrate the interpolating parabola through 3 equally-spaced points."

**Why this drill exists:** students treat interpolation and numerical integration as unrelated topics with separate formulas to memorize, when Newton-Cotes quadrature (trapezoidal, Simpson's) is built by integrating an interpolating polynomial — the interpolation error and the integration error share the same root cause.
