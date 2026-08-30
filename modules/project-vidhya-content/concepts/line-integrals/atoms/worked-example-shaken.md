---
# Alternative body for line-integrals.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: line-integrals.worked_example.shaken
concept_id: line-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: line-integrals.worked_example
for_stance: shaken
---

$\int_C(2x+y)\,ds$ along $\mathbf r(t)=(t,t)$, $0\le t\le1$. First the velocity: $\frac{d\mathbf r}{dt}=(1,1)$, so $\left|\frac{d\mathbf r}{dt}\right|=\sqrt{1^2+1^2}=\sqrt2$, and $ds=\sqrt2\,dt$.

Next substitute the path into the integrand: on the curve $x=t,\,y=t$, so $2x+y=2t+t=3t$.

Now the integral is single-variable: $\int_C(2x+y)\,ds=\int_0^13t\cdot\sqrt2\,dt=\sqrt2\int_0^13t\,dt=\sqrt2\left[\frac{3t^2}{2}\right]_0^1=\sqrt2\cdot\frac32=\frac{3\sqrt2}{2}$.

Check the bounds match the direction of travel: $t=0$ gives $(0,0)$ and $t=1$ gives $(1,1)$, matching the stated path, so the limits are set up correctly.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Line integral on a straight segment","steps":[{"prompt":"Given the parametrization $\\mathbf{r}(t) = (t, t)$, what is the derivative $\\frac{d\\mathbf{r}}{dt}$?","hint":"Component-wise: $\\frac{dx}{dt} = 1$ and $\\frac{dy}{dt} = 1$.","answer":"$\\frac{d\\mathbf{r}}{dt} = (1, 1)$"},{"prompt":"What is the magnitude $\\left|\\frac{d\\mathbf{r}}{dt}\\right|$?","hint":"Use the distance formula: $\\sqrt{(1)^2 + (1)^2}$.","answer":"$\\sqrt{2}$"},{"prompt":"Substitute the parametrization into $f(x,y) = 2x + y$ to get $f(x(t), y(t))$.","hint":"When $x = t$ and $y = t$, the function becomes $2t + t$.","answer":"$3t$"},{"prompt":"Now integrate: $\\int_0^1 3t \\cdot \\sqrt{2} \\, dt$. What is the result?","hint":"Pull out the constant $\\sqrt{2}$ and integrate $3t$.","answer":"$\\frac{3\\sqrt{2}}{2}$"}],"caption":"Master line integral evaluation: parametrize → differentiate → substitute → integrate."}
```
