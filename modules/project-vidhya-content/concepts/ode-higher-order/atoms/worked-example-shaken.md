---
# Alternative body for ode-higher-order-worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-higher-order.worked-example.shaken
concept_id: ode-higher-order
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-higher-order-worked-example
for_stance: shaken
---

## Solve $y'''-6y''+11y'-6y=0$

**Classify.** Substitute $y=e^{rx}$: this constant-coefficient homogeneous equation reduces to one cubic, the auxiliary equation $r^3-6r^2+11r-6=0$.

**Solve.** Try $r=1$: $1-6+11-6=0$. It works, so $(r-1)$ divides out cleanly: $r^3-6r^2+11r-6=(r-1)(r-2)(r-3)$. Three distinct real roots: $1$, $2$, $3$.

Each distinct real root contributes one basis function $e^{rx}$:

$$\boxed{y=C_1e^{x}+C_2e^{2x}+C_3e^{3x}}$$

**Check.** Substitute $r=2$ and $r=3$ back into the auxiliary equation: $8-24+22-6=0$ and $27-54+33-6=0$. Both hold, confirming the factorisation.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y''' − 6y'' + 11y' − 6y = 0","steps":[{"prompt":"The ODE y''' − 6y'' + 11y' − 6y = 0 leads to the auxiliary equation r³ − 6r² + 11r − 6 = 0. How do you find the roots efficiently for a GATE problem?","hint":"Try small positive integers as candidates (rational root theorem). Substitute r = 1 into the polynomial first.","answer":"Substitute r = 1: 1 − 6 + 11 − 6 = 0 ✓. Divide out (r − 1) to get (r − 1)(r² − 5r + 6) = (r − 1)(r − 2)(r − 3). Roots are 1, 2, 3."},{"prompt":"Given three distinct real roots r = 1, 2, 3, write the general solution. How many arbitrary constants should it have, and why?","hint":"Each distinct root contributes one independent basis function e^(r·x). A third-order ODE needs exactly three independent solutions.","answer":"y = C₁eˣ + C₂e^(2x) + C₃e^(3x). Three constants because the ODE is third order — its solution space is 3-dimensional."}]}
```

The one number to count: three roots for a third-order equation, so exactly three constants — never more, never fewer.
