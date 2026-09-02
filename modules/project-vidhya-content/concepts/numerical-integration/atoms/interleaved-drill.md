---
id: numerical-integration.interleaved-drill
concept_id: numerical-integration
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: numerical-integration → interpolation.**

$f(0)=1$, $f(1)=0.5$, $f(2)=1/3$ (samples of $1/(1+x)$).

**Q1.** Compute the Simpson's 1/3 estimate for $\int_0^2\frac{dx}{1+x}$ with these three points.
**A1.** $h=1$: $I\approx\frac{1}{3}[1+4(0.5)+0.3333]=1.1111$ (true value $\ln3\approx1.0986$).

**Q2.** Build the interpolating quadratic through the same three points and integrate *that* polynomial over $[0,2]$ directly — how does the result compare to Q1?
**A2.** The quadratic is $1-0.6667x+0.1667x^2$; $\int_0^2$ of it is exactly $1.1111$ — identical to the Simpson estimate, because Simpson's rule is nothing more than integrating the interpolating parabola through equally-spaced samples.

**Why this drill exists:** treating Simpson's rule as an isolated formula to memorize hides the fact that its accuracy — and its failure modes (Runge's phenomenon on unevenly-behaved data) — are inherited directly from polynomial interpolation, not a separate integration-specific property.
