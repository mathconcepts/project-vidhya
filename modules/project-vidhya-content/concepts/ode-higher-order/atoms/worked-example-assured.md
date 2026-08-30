---
# Alternative body for ode-higher-order-worked-example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-higher-order.worked-example.assured
concept_id: ode-higher-order
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-higher-order-worked-example
for_stance: assured
---

## $y'''-6y''+11y'-6y=0$: the roots decide everything

Auxiliary equation $r^3-6r^2+11r-6=0$; $r=1$ is a root by inspection ($1-6+11-6=0$), leaving $(r-1)(r-2)(r-3)$ after division — three distinct real roots.

$$\boxed{y=C_1e^{x}+C_2e^{2x}+C_3e^{3x}}$$

The trap worth naming: a third-order equation demands exactly three independent constants. A factorisation that yields only two distinct roots (one repeated) needs the $xe^{rx}$ partner supplied for the repeated one, not a second copy of the same exponential under a different label — and a complex conjugate pair needs $\cos,\sin$ in the final answer, never the raw complex exponentials.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y''' − 6y'' + 11y' − 6y = 0","steps":[{"prompt":"The ODE y''' − 6y'' + 11y' − 6y = 0 leads to the auxiliary equation r³ − 6r² + 11r − 6 = 0. How do you find the roots efficiently for a GATE problem?","hint":"Try small positive integers as candidates (rational root theorem). Substitute r = 1 into the polynomial first.","answer":"Substitute r = 1: 1 − 6 + 11 − 6 = 0 ✓. Divide out (r − 1) to get (r − 1)(r² − 5r + 6) = (r − 1)(r − 2)(r − 3). Roots are 1, 2, 3."},{"prompt":"Given three distinct real roots r = 1, 2, 3, write the general solution. How many arbitrary constants should it have, and why?","hint":"Each distinct root contributes one independent basis function e^(r·x). A third-order ODE needs exactly three independent solutions.","answer":"y = C₁eˣ + C₂e^(2x) + C₃e^(3x). Three constants because the ODE is third order — its solution space is 3-dimensional."}]}
```
