---
id: ode-exact.exam-pattern
concept_id: ode-exact
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ/NAT "find the constant" questions** give an equation with a free parameter and ask what value makes it exact. Example: for $(2xy + ky^2)\,dx + (x^2 + 2xy)\,dy = 0$, $M_y = 2x+2ky$ and $N_x=2x+2y$; matching requires $k=1$ — a single equation-solving step once the partials are written down.

- **NAT questions ask for $F(x,y)$ evaluated at a point**, after confirming exactness and carrying out both integration steps — this rewards writing $g(y)$ explicitly rather than leaving it as an unresolved function.

- **MSQ "true/false" questions test the exactness *test* itself**, not just application — e.g. "if $M_y \neq N_x$, the equation has no solution" (false — an integrating factor may still exist) versus "if $M_y=N_x$ everywhere, $F(x,y)=C$ is the general solution" (true).

- **Integrating-factor sub-questions appear as a second part**: once exactness fails, GATE expects you to check the two ratios in order — $(M_y-N_x)/N$ depends on $x$ alone, or $(N_x-M_y)/M$ depends on $y$ alone — before concluding no elementary factor exists.

- **Time budget:** the exactness test itself is under 30 seconds (two partial derivatives, one comparison); the full solve including both integration steps should stay under 2 minutes for a polynomial $M,N$.
