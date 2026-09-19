---
id: indefinite-integration.intuition.shaken
concept_id: indefinite-integration
atom_type: intuition
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
variant_of: indefinite-integration.intuition
for_stance: shaken
---

Before picking a technique, ask one question first: is there a piece of the integrand AND its own derivative sitting together? Check that before anything else.

Take $\int \dfrac{x}{(x^2+1)^2}\,dx$. It looks like a rational function, so partial fractions seems like the plan. Try it: write $\dfrac{A}{x^2+1}+\dfrac{B}{(x^2+1)^2}$. Combine over one denominator. The top comes out as $A(x^2+1)+B$ — only even powers of $x$, plus a constant. The real top is $x$, an odd power. No value of $A$ or $B$ fixes that. Stuck.

Go back to the first question instead. Let $u=x^2+1$. Then $du=2x\,dx$, so $x\,dx=\frac{1}{2}du$. The integral becomes $\int \frac{1}{2}u^{-2}\,du=-\dfrac{1}{2u}+C=-\dfrac{1}{2(x^2+1)}+C$. Two lines, no stuck point. Always ask the substitution question first.
