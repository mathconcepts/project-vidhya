---
id: random-variables.formal-definition
concept_id: random-variables
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Discrete random variable.** A PMF $p(x)=P(X=x)$ satisfies $p(x)\ge 0$ for all $x$ and $\sum_x p(x)=1$.

**Continuous random variable.** A PDF $f(x)\ge 0$ satisfies $\int_{-\infty}^{\infty} f(x)\,dx = 1$; probabilities come from areas, $P(a\le X\le b) = \int_a^b f(x)\,dx$.

**CDF** (either case): $F(x)=P(X\le x)$, non-decreasing, $F(-\infty)=0$, $F(\infty)=1$.

**Expectation and variance:** $E[X]=\sum x\,p(x)$ (discrete) or $\int x f(x)\,dx$ (continuous); $\text{Var}(X)=E[X^2]-(E[X])^2$.

Use the discrete PMF sum whenever the outcome space is a finite or countable list (a table of values and probabilities); don't reach for $\int f(x)\,dx$ there — a frequent misstep when a question is phrased with continuous-sounding language ("the amount of…") even though the actual outcomes given are isolated points.
