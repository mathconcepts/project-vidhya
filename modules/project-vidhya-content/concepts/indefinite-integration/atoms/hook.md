---
id: indefinite-integration.hook
concept_id: indefinite-integration
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

A JEE mock test throws this at you: $\int \dfrac{2x+3}{x^2+3x+7}\,dx$. Three methods flash through your mind at once — partial fractions, because it is a ratio of two polynomials; integration by parts, because the top and bottom look different; or plain substitution. Only one of these actually works in ten seconds. Differentiate the bottom: $\dfrac{d}{dx}(x^2+3x+7)=2x+3$ — exactly the top, sitting there already. That match is the entire problem. Let $u=x^2+3x+7$, so $du=(2x+3)\,dx$, and the integral collapses to $\int \dfrac{du}{u}=\ln|u|+C$. Partial fractions would have burned your first ninety seconds factoring a denominator that never factors over the reals at all — its discriminant is $9-28=-19$.
