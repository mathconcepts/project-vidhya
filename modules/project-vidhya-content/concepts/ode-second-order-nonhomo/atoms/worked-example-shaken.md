---
# Alternative body for ode-second-order-nonhomo-worked-example, served when
# the learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-second-order-nonhomo.worked-example.shaken
concept_id: ode-second-order-nonhomo
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-second-order-nonhomo-worked-example
for_stance: shaken
---

## Solve $y''-3y'+2y=e^{3x}$

**Classify the homogeneous part.** $r^2-3r+2=(r-1)(r-2)=0$, roots $1,2$: $y_h=C_1e^{x}+C_2e^{2x}$.

**Classify the forcing.** The right side is $e^{3x}$, and $r=3$ isn't one of the roots above, so try $y_p=Ae^{3x}$.

**Solve.** $y_p'=3Ae^{3x}$, $y_p''=9Ae^{3x}$. Substituting: $9Ae^{3x}-9Ae^{3x}+2Ae^{3x}=2Ae^{3x}=e^{3x}$, so $A=\dfrac12$.

$$\boxed{y=C_1e^{x}+C_2e^{2x}+\dfrac12e^{3x}}$$

**Check.** For the $y_p$ piece alone: $y_p''-3y_p'+2y_p=(9-9+2)\cdot\dfrac12e^{3x}=e^{3x}$. Matches. The $y_h$ piece contributes $0$ on its own, since it solves the homogeneous equation by construction.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: undetermined coefficients for y'' − 3y' + 2y = e^(3x)","steps":[{"prompt":"The ODE is y'' − 3y' + 2y = e^(3x). Write down the characteristic equation and find its roots.","hint":"Replace y with e^(rx): r² − 3r + 2 = 0. Factor the left side.","answer":"r² − 3r + 2 = (r−1)(r−2) = 0, so r₁ = 1 and r₂ = 2. The complementary function is y_h = C₁eˣ + C₂e^(2x)."},{"prompt":"The forcing term is e^(3x). What is the correct trial solution y_p for undetermined coefficients, and what value of A does substitution give?","hint":"Since r = 3 is not a root of the characteristic equation, try y_p = Ae^(3x). Compute y_p'' − 3y_p' + 2y_p and match to e^(3x).","answer":"y_p = Ae^(3x) gives (9A − 9A + 2A)e^(3x) = e^(3x), so 2A = 1 and A = 1/2. Thus y_p = (1/2)e^(3x)."}]}
```

One number decides the whole approach: whether the forcing rate matches a root. Here $3$ matches neither $1$ nor $2$, so the plain trial works as written.
