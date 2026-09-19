---
id: differential-equations-jee.interleaved-drill
concept_id: differential-equations-jee
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
modality: drill
tested_by_atom: differential-equations-jee.micro_exercise
exam_ids: ["*"]
---

**Cross-concept check: differential equations $\to$ partial fractions, and back to formation.**

**Question 1 (separating a DE needs an indefinite-integration technique):** Solve $\dfrac{dy}{dx}=\dfrac{y(y-1)}{x}$.

*Answer:* Separate: $\dfrac{dy}{y(y-1)}=\dfrac{dx}{x}$. The left side needs partial fractions before it can be integrated: $\dfrac{1}{y(y-1)}=\dfrac{1}{y-1}-\dfrac{1}{y}$ (check: common denominator gives $\dfrac{y-(y-1)}{y(y-1)}=\dfrac{1}{y(y-1)}$, confirmed). Integrating both sides:

$$\ln|y-1|-\ln|y|=\ln|x|+C \;\Rightarrow\; \ln\left|\frac{y-1}{y}\right|=\ln|x|+C \;\Rightarrow\; \frac{y-1}{y}=kx$$

Separating variables is only step one — the resulting integral is rarely a standard form on sight, and here it needed exactly the partial-fractions skill from indefinite integration to finish.

**Question 2 (the reverse skill: form the DE back from this family):** The family $\dfrac{y-1}{y}=kx$ has one arbitrary constant, $k$. Differentiate to eliminate it and confirm you recover the original equation.

*Answer:* Rewrite as $1-\dfrac{1}{y}=kx$. Differentiate both sides with respect to $x$: $\dfrac{1}{y^2}\dfrac{dy}{dx}=k$. From the original relation, $k=\dfrac{1-1/y}{x}=\dfrac{y-1}{xy}$. Substituting:

$$\frac{1}{y^2}\frac{dy}{dx}=\frac{y-1}{xy} \;\Rightarrow\; \frac{dy}{dx}=\frac{y^2(y-1)}{xy}=\frac{y(y-1)}{x}$$

— exactly the equation Question 1 started from.

**Why this drill exists:** solving a separable equation and forming one from a family are the same algebra run in opposite directions, and partial fractions is the connective tissue between "separate the variables" and "actually finish the integral" for a large share of JEE's separable-equation questions.
