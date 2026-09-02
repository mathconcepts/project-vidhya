---
# for_stance: shaken — same problem, terse steps, full arithmetic shown, explicit check.
id: ode-second-order-homo.worked-example.shaken
concept_id: ode-second-order-homo
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-second-order-homo.worked-example
for_stance: shaken
---

$y''+4y'+13y=0$, $y(0)=0$, $y'(0)=3$.

Characteristic equation: $r^2+4r+13=0$.

Roots: $r=\dfrac{-4\pm\sqrt{16-52}}{2}=-2\pm3i$.

General solution: $y=e^{-2x}(C_1\cos3x+C_2\sin3x)$.

Apply $y(0)=0$: $C_1=0$.

Differentiate: $y'=e^{-2x}\big[-2(C_1\cos3x+C_2\sin3x)+(-3C_1\sin3x+3C_2\cos3x)\big]$.

Apply $y'(0)=3$ with $C_1=0$: $3C_2=3$, so $C_2=1$.

$$\boxed{y(x)=e^{-2x}\sin(3x)}$$

Check: $y'(x)=e^{-2x}(3\cos3x-2\sin3x)$. At $x=0$: $y=0$, $y'=3$. Both match the given conditions.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y'' + 4y' + 13y = 0 by characteristic roots","steps":[{"prompt":"Write the characteristic equation for $y''+4y'+13y=0$.","hint":"Replace $y''$ with $r^2$, $y'$ with $r$, $y$ with $1$.","answer":"$r^2+4r+13=0$."},{"prompt":"Solve for the roots using the quadratic formula.","hint":"Compute the discriminant $16-52$ first — it is negative, so expect a complex pair.","answer":"$r=\\\\dfrac{-4\\\\pm\\\\sqrt{-36}}{2}=-2\\\\pm3i$."},{"prompt":"Given $y(0)=0$ and $y'(0)=3$, find the particular solution.","hint":"General solution is $y=e^{-2x}(C_1\\\\cos3x+C_2\\\\sin3x)$. Use $y(0)=0$ first to get $C_1$, then differentiate for $y'(0)$.","answer":"$C_1=0$, then $y'(0)=3C_2=3$ gives $C_2=1$, so $y(x)=e^{-2x}\\\\sin(3x)$."}]}
```
