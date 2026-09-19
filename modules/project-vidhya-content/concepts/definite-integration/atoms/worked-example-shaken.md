---
id: definite-integration.worked-example.shaken
concept_id: definite-integration
atom_type: worked_example
scaffold_fade: true
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
variant_of: definite-integration.worked_example
for_stance: shaken
---

## The two curves

$y=x$ and $y=x^2$. Find the area between them.

## Find the crossing points

$x=x^2 \Rightarrow x^2-x=0 \Rightarrow x(x-1)=0$. So $x=0$ and $x=1$.

## Which curve is on top?

Try $x=0.5$: $y=x$ gives $0.5$. $y=x^2$ gives $0.25$. Since $0.5>0.25$, $y=x$ is on top.

## Set up the integral

$$\text{Area}=\int_0^1 (x-x^2)\,dx$$

## Evaluate

$$\left[\frac{x^2}{2}-\frac{x^3}{3}\right]_0^1=\frac{1}{2}-\frac{1}{3}=\frac{1}{6}$$

$$\boxed{\text{Area}=\frac{1}{6}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: area between y=x and y=x²","why":"Finding where curves cross tells you the limits; checking which curve is on top BEFORE integrating is what stops a sign error from silently flipping the answer negative.","steps":[{"prompt":"Where do y=x and y=x² intersect?","hint":"Set x = x² and solve.","answer":"x=0 and x=1"},{"prompt":"On (0,1), which curve is on top?","hint":"Test x=0.5 in both: 0.5 vs 0.25.","answer":"y=x is on top (0.5 > 0.25)"},{"prompt":"Set up the area integral.","hint":"Top minus bottom, over the interval found in step 1.","answer":"∫₀¹ (x − x²) dx"},{"prompt":"Evaluate it.","hint":"Antiderivative is x²/2 − x³/3, evaluated at 1 minus at 0.","answer":"1/2 − 1/3 = 1/6"}],"caption":"Always check WHICH curve is on top before integrating — subtracting in the wrong order flips the sign of the whole answer."}
```
