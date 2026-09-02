---
id: random-variables.intuition
concept_id: random-variables
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

A discrete random variable's PMF is a list of weights sitting on the number line — one weight per possible value, all weights non-negative, all weights summing to exactly 1. Picture it as a bar chart: the height at each value is how much probability mass sits there.

The CDF is the running total of that bar chart, read left to right: $F(x) = P(X \le x)$ climbs by exactly the PMF's height every time you pass a value with positive weight, and stays flat everywhere else — a staircase, not a smooth curve, for a discrete variable.

Expectation $E[X] = \sum x\,P(x)$ is the bar chart's center of mass: balance the whole weighted line on a single point and that point is $E[X]$ — not necessarily a value the variable can actually take.

Variance measures how spread out the mass is around that balance point: $\text{Var}(X)=E[(X-E[X])^2]$, computed in practice as $E[X^2]-(E[X])^2$ because expanding the square and using linearity of expectation gets there without ever computing a single deviation directly.
