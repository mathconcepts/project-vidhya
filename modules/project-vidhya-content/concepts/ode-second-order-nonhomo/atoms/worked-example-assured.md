---
# Alternative body for ode-second-order-nonhomo-worked-example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-second-order-nonhomo.worked-example.assured
concept_id: ode-second-order-nonhomo
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-second-order-nonhomo-worked-example
for_stance: assured
---

## $y''-3y'+2y=e^{3x}$: check for a collision before trialing $y_p$

$r^2-3r+2=(r-1)(r-2)=0$ gives $y_h=C_1e^x+C_2e^{2x}$. The forcing rate $3$ collides with neither root, so the plain trial $y_p=Ae^{3x}$ is safe; substituting gives $2A=1$, $A=\dfrac12$.

$$\boxed{y=C_1e^{x}+C_2e^{2x}+\dfrac12e^{3x}}$$

Had the forcing been $e^{2x}$ instead — matching the root $r=2$ — the plain trial forces $0=e^{2x}$ on substitution. The fix is $y_p=Axe^{2x}$: one extra factor of $x$ per matching multiplicity, not a different function altogether.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: undetermined coefficients for y'' − 3y' + 2y = e^(3x)","steps":[{"prompt":"The ODE is y'' − 3y' + 2y = e^(3x). Write down the characteristic equation and find its roots.","hint":"Replace y with e^(rx): r² − 3r + 2 = 0. Factor the left side.","answer":"r² − 3r + 2 = (r−1)(r−2) = 0, so r₁ = 1 and r₂ = 2. The complementary function is y_h = C₁eˣ + C₂e^(2x)."},{"prompt":"The forcing term is e^(3x). What is the correct trial solution y_p for undetermined coefficients, and what value of A does substitution give?","hint":"Since r = 3 is not a root of the characteristic equation, try y_p = Ae^(3x). Compute y_p'' − 3y_p' + 2y_p and match to e^(3x).","answer":"y_p = Ae^(3x) gives (9A − 9A + 2A)e^(3x) = e^(3x), so 2A = 1 and A = 1/2. Thus y_p = (1/2)e^(3x)."}]}
```
