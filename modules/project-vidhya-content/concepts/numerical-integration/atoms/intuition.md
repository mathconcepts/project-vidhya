---
id: numerical-integration.intuition
concept_id: numerical-integration
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

## Trading the antiderivative for a weighted sum

Split $[a,b]$ into $n$ equal strips of width $h=(b-a)/n$, at nodes $x_i=a+ih$.

**Trapezoidal rule** replaces $f$ on each strip with the straight line joining its two endpoint values — a trapezoid instead of the true curved region:

$$\int_a^b f\,dx\approx\frac{h}{2}\bigl[f(x_0)+2f(x_1)+\dots+2f(x_{n-1})+f(x_n)\bigr]$$

The picture of the error: a straight edge cuts corners off a convex bump and adds extra area under a concave dip — global error $O(h^2)$.

**Simpson's 1/3 rule** fits a parabola through each group of three consecutive nodes instead ($n$ must be even):

$$\int_a^b f\,dx\approx\frac{h}{3}\bigl[f(x_0)+4f(x_1)+2f(x_2)+4f(x_3)+\dots+f(x_n)\bigr]$$

A parabola hugs a smooth curve far better than a straight edge, cutting the error to $O(h^4)$ — and, as a happy accident, the formula is *exact* for any cubic, one degree higher than the parabola it's built from.

**Gaussian quadrature** goes further still, choosing both the weights and the node positions (not equally spaced) so an $n$-point rule integrates polynomials up to degree $2n-1$ exactly — the most accuracy per function evaluation, at the cost of irregular nodes.
