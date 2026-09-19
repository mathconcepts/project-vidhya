---
id: definite-integration.worked-example.assured
concept_id: definite-integration
atom_type: worked_example
scaffold_fade: true
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
variant_of: definite-integration.worked_example
for_stance: assured
---

## Where the marks actually sit

$y=x$ and $y=x^2$ meet at $x=0,1$; on $(0,1)$, $x>x^2$ (test $x=0.5$: $0.5>0.25$), so no crossing occurs inside the interval and no split is needed.

$$\text{Area}=\int_0^1(x-x^2)\,dx=\left[\frac{x^2}{2}-\frac{x^3}{3}\right]_0^1=\frac{1}{6}$$

$$\boxed{\frac{1}{6}}$$

## The check that costs marks when skipped

Confirming which curve is on top before integrating is not a formality — subtract in the wrong order and the integral evaluates to $-\frac{1}{6}$, a negative "area" that a rushed student sometimes reports as-is rather than recognising the sign as a signal the subtraction order was backwards. On a region with a crossing INSIDE the interval, skipping this check is worse: the two pieces need opposite subtraction orders, and treating the whole interval as one piece produces neither the right magnitude nor the right sign.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: area between y=x and y=x²","why":"Finding where curves cross tells you the limits; checking which curve is on top BEFORE integrating is what stops a sign error from silently flipping the answer negative.","steps":[{"prompt":"Where do y=x and y=x² intersect?","hint":"Set x = x² and solve.","answer":"x=0 and x=1"},{"prompt":"On (0,1), which curve is on top?","hint":"Test x=0.5 in both: 0.5 vs 0.25.","answer":"y=x is on top (0.5 > 0.25)"},{"prompt":"Set up the area integral.","hint":"Top minus bottom, over the interval found in step 1.","answer":"∫₀¹ (x − x²) dx"},{"prompt":"Evaluate it.","hint":"Antiderivative is x²/2 − x³/3, evaluated at 1 minus at 0.","answer":"1/2 − 1/3 = 1/6"}],"caption":"Always check WHICH curve is on top before integrating — subtracting in the wrong order flips the sign of the whole answer."}
```
