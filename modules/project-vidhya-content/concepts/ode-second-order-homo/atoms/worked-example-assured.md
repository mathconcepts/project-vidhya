---
# Alternative body for ode-second-order-homo.worked-example, served when the
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
id: ode-second-order-homo.worked-example.assured
concept_id: ode-second-order-homo
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-second-order-homo.worked-example
for_stance: assured
---

## $y''-3y'+2y=0$: roots first, everything else follows

Characteristic equation $r^2-3r+2=(r-1)(r-2)=0$, roots $1,2$ — real and distinct, so

$$\boxed{y=c_1e^{x}+c_2e^{2x}}$$

with no further casework needed here. Keep the other two cases ready anyway: a repeated root (discriminant $0$) forces $(c_1+c_2x)e^{rx}$ instead, and a negative discriminant forces $e^{\alpha x}(c_1\cos\beta x+c_2\sin\beta x)$ from the complex pair $\alpha\pm i\beta$ — this problem's clean factorisation is the easy branch, not the general rule.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: y'' - 3y' + 2y = 0","steps":[{"prompt":"Step 1: Assume $y = e^{rx}$ and find $y'$ and $y''$.","hint":"Use the chain rule: if $y = e^{rx}$ then $y' = re^{rx}$ and $y'' = r^2 e^{rx}$.","answer":"$y' = re^{rx}$ and $y'' = r^2 e^{rx}$"},{"prompt":"Step 2: Substitute into $y'' - 3y' + 2y = 0$ and factor out $e^{rx}$.","hint":"You should get $e^{rx}(r^2 - 3r + 2) = 0$. Since $e^{rx} \\neq 0$, set the bracket to zero.","answer":"The characteristic equation is $r^2 - 3r + 2 = 0$."},{"prompt":"Step 3: Factor the quadratic $r^2 - 3r + 2 = 0$ to find both roots.","hint":"Look for two numbers that multiply to 2 and add to -3. They are -1 and -2.","answer":"$(r - 1)(r - 2) = 0$, so $r_1 = 1$ and $r_2 = 2$."},{"prompt":"Step 4: Write the general solution for two distinct real roots.","hint":"The formula is $y = c_1 e^{r_1 x} + c_2 e^{r_2 x}$.","answer":"$y = c_1 e^x + c_2 e^{2x}$"}],"caption":"Key exam insight: characteristic equation → roots → general solution. The formula structure is the same for all second-order homogeneous ODEs."}
```
