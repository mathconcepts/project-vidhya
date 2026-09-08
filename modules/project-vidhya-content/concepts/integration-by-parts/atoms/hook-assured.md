---
# Alternative body for integration-by-parts.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-by-parts.hook.assured
concept_id: integration-by-parts
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: integration-by-parts.hook
for_stance: assured
---

GATE hides this behind "integrate the product $f(x)g(x)$" — and the wrong instinct is treating $\int$ as if it distributes over multiplication the way it does over addition, writing $\int fg\,dx\overset{?}{=}\big(\int f\,dx\big)\big(\int g\,dx\big)$. It never does — that identity fails even for $f=g=x$. Integration by parts exists precisely because no such shortcut exists for products, only for sums.

```interactive-spec
{"v":1,"kind":"simulation","title":"F(t) = t*e^t - e^t crosses zero exactly at t=1","why":"This traces the antiderivative x*e^x - e^x found by integration by parts. It dips negative, crosses zero at x=1, then grows fast — every value checkable by differentiating back.","x_expr":"t","y_expr":"t*exp(t) - exp(t)","t_min":0,"t_max":2,"duration_sec":8,"view_box":{"x_min":-0.2,"x_max":2.2,"y_min":-1.6,"y_max":8.0},"narration_steps":[{"at_progress":0.0,"text":"At $x=0$, $F(x)=xe^x-e^x=0-1=-1$ — the antiderivative starts below zero.","text_shaken":"At $x=0$: $F=0\\cdot e^0-e^0=0-1=-1$.","text_assured":"$F(0)=-1$, the antiderivative's starting value below the axis.","focus_point":true},{"at_progress":0.25,"text":"At $x=0.5$, $F(0.5)\\approx-0.824$ — still negative, but rising. As $x$ keeps growing, will $F$ cross zero before $x=1$, exactly at $x=1$, or after?","text_shaken":"At $x=0.5$: $F\\approx-0.824$, still negative. Predict: does $F$ hit zero before $x=1$, at $x=1$, or after?","text_assured":"$F(0.5)\\approx-0.824$. Predict where $F(x)=0$ falls relative to $x=1$."},{"at_progress":0.5,"text":"At $x=1$, $F(1)=1\\cdot e-e=0$ exactly — the antiderivative crosses zero precisely here, since $e^x(x-1)=0$ forces $x=1$.","text_shaken":"At $x=1$: $F(1)=e-e=0$ exactly.","text_assured":"$F(1)=e^1(1-1)=0$ — the unique real root of $e^x(x-1)=0$.","emphasize":true,"focus_point":true},{"at_progress":0.75,"text":"Past $x=1$, $F$ grows fast: $F(1.5)\\approx2.241$. Check by differentiating: $\\frac{d}{dx}[xe^x-e^x]=e^x+xe^x-e^x=xe^x$ — exactly the original integrand, confirming the parts formula traded a hard product integral for an easy one.","text_shaken":"At $x=1.5$: $F\\approx2.241$. Differentiate back: $\\frac{d}{dx}[xe^x-e^x]=xe^x$ — matches the original integrand.","text_assured":"$\\frac{d}{dx}[xe^x-e^x]=xe^x$ confirms the trade: $u=x$ (differentiate to $1$), $dv=e^x\\,dx$ (integrate to $e^x$)."},{"at_progress":1.0,"text":"At $x=2$, $F(2)=2e^2-e^2=e^2\\approx7.389$.","trap":{"text":"Students drop the minus sign in $\\int u\\,dv=uv-\\int v\\,du$, computing $xe^x+e^x$ instead.","avoid":"Differentiate the wrong-sign version to see it fails: $\\frac{d}{dx}[xe^x+e^x]=2e^x+xe^x\\neq xe^x$ — the minus sign in the formula is not optional."}}],"ghost":{"x_expr":"t","y_expr":"t*exp(t) + exp(t)"}}
```
