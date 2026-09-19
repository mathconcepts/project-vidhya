---
id: definite-integration.worked_example
concept_id: definite-integration
atom_type: worked_example
scaffold_fade: true
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
---

## Problem

Find the area of the region enclosed between $y=x$ and $y=x^2$.

---

**Step 1: Find where the curves cross — this fixes the limits of integration.**

Set $x=x^2 \Rightarrow x^2-x=0 \Rightarrow x(x-1)=0 \Rightarrow x=0$ or $x=1$. The region is bounded between $x=0$ and $x=1$.

**Step 2: Decide which curve is on top over that interval.**

Test a point strictly inside, $x=0.5$: $y=x$ gives $0.5$; $y=x^2$ gives $0.25$. Since $0.5>0.25$, the line $y=x$ lies above the parabola $y=x^2$ across the whole interval $(0,1)$ — no crossing happens in between, so no split is needed.

**Step 3: Set up the area integral as top minus bottom.**

$$\text{Area} = \int_0^1 \left[x - x^2\right] dx$$

**Step 4: Evaluate using the Fundamental Theorem.**

$$\int_0^1 (x-x^2)\,dx = \left[\frac{x^2}{2}-\frac{x^3}{3}\right]_0^1 = \left(\frac{1}{2}-\frac{1}{3}\right) - (0-0) = \frac{1}{6}$$

$$\boxed{\text{Area} = \frac{1}{6}}$$

**Step 5: Sanity check the size.**

The region sits entirely inside the unit square $[0,1]\times[0,1]$, whose area is $1$, so $\frac{1}{6}$ (about $17\%$ of that square) is a reasonable-sized sliver between two curves that touch at both ends and separate only in the middle.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: area between y=x and y=x²","why":"Finding where curves cross tells you the limits; checking which curve is on top BEFORE integrating is what stops a sign error from silently flipping the answer negative.","steps":[{"prompt":"Where do y=x and y=x² intersect?","hint":"Set x = x² and solve.","answer":"x=0 and x=1"},{"prompt":"On (0,1), which curve is on top?","hint":"Test x=0.5 in both: 0.5 vs 0.25.","answer":"y=x is on top (0.5 > 0.25)"},{"prompt":"Set up the area integral.","hint":"Top minus bottom, over the interval found in step 1.","answer":"∫₀¹ (x − x²) dx"},{"prompt":"Evaluate it.","hint":"Antiderivative is x²/2 − x³/3, evaluated at 1 minus at 0.","answer":"1/2 − 1/3 = 1/6"}],"caption":"Always check WHICH curve is on top before integrating — subtracting in the wrong order flips the sign of the whole answer."}
```
