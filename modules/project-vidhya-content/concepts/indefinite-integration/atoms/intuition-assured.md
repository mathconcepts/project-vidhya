---
id: indefinite-integration.intuition.assured
concept_id: indefinite-integration
atom_type: intuition
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
variant_of: indefinite-integration.intuition
for_stance: assured
---

A rational integrand does not automatically mean partial fractions. Check the numerator against the denominator's factor structure first: if the numerator is (a multiple of) the derivative of some factor, substitution wins outright, and reaching for partial fractions is not just slower — on $\int \dfrac{x}{(x^2+1)^2}\,dx$ it is a genuine dead end. The natural-looking ansatz $\dfrac{A}{x^2+1}+\dfrac{B}{(x^2+1)^2}$ can only ever generate an even numerator, $A(x^2+1)+B$, and the true numerator $x$ is odd — no $A,B$ closes that gap, no matter how long you grind at it. The correct ansatz for a repeated irreducible quadratic needs linear numerators throughout, $(Ax+B)/(x^2+1)+(Cx+D)/(x^2+1)^2$; substitution ($u=x^2+1$) sidesteps needing that machinery at all, collapsing the integral to $-1/(2(x^2+1))+C$ in two lines. The general habit this earns: partial fractions is the technique of last resort among the three, reached for only once substitution and by-parts have both been ruled out.
