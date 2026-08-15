---
id: line-integrals.worked_example
concept_id: line-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Computing Work Along a Curved Path

## Problem

Evaluate the line integral $\int_C (2x + y) \, ds$ where $C$ is the straight line from $(0,0)$ to $(1,1)$ parametrized by $\mathbf{r}(t) = (t, t)$, $0 \le t \le 1$.

## Solution

**Step 1: Parametrize the curve.**

Given: $x(t) = t$, $y(t) = t$, where $0 \le t \le 1$.

**Step 2: Find the arc length element $ds$.**

The velocity vector is:
$$\frac{d\mathbf{r}}{dt} = \left(\frac{dx}{dt}, \frac{dy}{dt}\right) = (1, 1)$$

The magnitude is:
$$\left|\frac{d\mathbf{r}}{dt}\right| = \sqrt{1^2 + 1^2} = \sqrt{2}$$

Therefore, $ds = \sqrt{2} \, dt$.

**Step 3: Substitute into the integrand.**

Along the curve, $f(x(t), y(t)) = 2x(t) + y(t) = 2t + t = 3t$.

**Step 4: Set up and evaluate the integral.**

$$\int_C (2x + y) \, ds = \int_0^1 3t \cdot \sqrt{2} \, dt = \sqrt{2} \int_0^1 3t \, dt$$

$$= \sqrt{2} \left[\frac{3t^2}{2}\right]_0^1 = \sqrt{2} \cdot \frac{3}{2} = \frac{3\sqrt{2}}{2}$$

**Answer:** $\boxed{\frac{3\sqrt{2}}{2}}$ or approximately $2.12$.

---

## Key Exam Insight

The parametrization is crucial. Once you have $\mathbf{r}(t)$, compute $|d\mathbf{r}/dt|$ and substitute to get a single-variable integral. Always check the bounds on $t$ match the curve direction (here, $t$ goes from 0 to 1 as we move from $(0,0)$ to $(1,1)$).

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Line integral on a straight segment","steps":[{"prompt":"Given the parametrization $\\mathbf{r}(t) = (t, t)$, what is the derivative $\\frac{d\\mathbf{r}}{dt}$?","hint":"Component-wise: $\\frac{dx}{dt} = 1$ and $\\frac{dy}{dt} = 1$.","answer":"$\\frac{d\\mathbf{r}}{dt} = (1, 1)$"},{"prompt":"What is the magnitude $\\left|\\frac{d\\mathbf{r}}{dt}\\right|$?","hint":"Use the distance formula: $\\sqrt{(1)^2 + (1)^2}$.","answer":"$\\sqrt{2}$"},{"prompt":"Substitute the parametrization into $f(x,y) = 2x + y$ to get $f(x(t), y(t))$.","hint":"When $x = t$ and $y = t$, the function becomes $2t + t$.","answer":"$3t$"},{"prompt":"Now integrate: $\\int_0^1 3t \\cdot \\sqrt{2} \\, dt$. What is the result?","hint":"Pull out the constant $\\sqrt{2}$ and integrate $3t$.","answer":"$\\frac{3\\sqrt{2}}{2}$"}],"caption":"Master line integral evaluation: parametrize → differentiate → substitute → integrate."}
```


---

**Summary:** Three GATE-quality atoms (intuition, visual_analogy, worked_example) for the Line Integrals concept are ready. The visual_analogy includes an animated parametric gif-scene showing an oscillating path. The worked_example includes a full four-step solution and an interactive guided walkthrough for exam practice.

DONE:line-integrals
