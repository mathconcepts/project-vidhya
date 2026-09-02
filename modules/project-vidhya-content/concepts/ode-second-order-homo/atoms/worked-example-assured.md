---
# for_stance: assured — the one distinction that costs marks: constants from a complex-root derivation must land real, not stay complex.
id: ode-second-order-homo.worked-example.assured
concept_id: ode-second-order-homo
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-second-order-homo.worked-example
for_stance: assured
---

The complex-root case hides one subtlety: $r=-2\pm3i$ gives two independent complex exponentials, $e^{(-2+3i)x}$ and $e^{(-2-3i)x}$, and it's tempting to keep the solution in that form and solve for complex constants $A,B$ directly from the real initial conditions — which technically works but obscures that $y$ is real-valued throughout. The standard move is to convert first: Euler's formula turns the complex pair into $e^{-2x}(C_1\cos3x+C_2\sin3x)$, with $C_1,C_2$ guaranteed real once $y(0),y'(0)$ are real, because $C_1=A+B$ and $C_2=i(A-B)$ collapse to real numbers exactly when $A,B$ are complex conjugates — which they must be, for a real characteristic equation to have a real solution.

For $y(0)=0,\,y'(0)=3$: $C_1=0$, $C_2=1$.

$$\boxed{y(x)=e^{-2x}\sin(3x)}$$

Solve in the cos/sin form from the start; it is both safer and matches how GATE expects the final answer written.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y'' + 4y' + 13y = 0 by characteristic roots","steps":[{"prompt":"Write the characteristic equation for $y''+4y'+13y=0$.","hint":"Replace $y''$ with $r^2$, $y'$ with $r$, $y$ with $1$.","answer":"$r^2+4r+13=0$."},{"prompt":"Solve for the roots using the quadratic formula.","hint":"Compute the discriminant $16-52$ first — it is negative, so expect a complex pair.","answer":"$r=\\\\dfrac{-4\\\\pm\\\\sqrt{-36}}{2}=-2\\\\pm3i$."},{"prompt":"Given $y(0)=0$ and $y'(0)=3$, find the particular solution.","hint":"General solution is $y=e^{-2x}(C_1\\\\cos3x+C_2\\\\sin3x)$. Use $y(0)=0$ first to get $C_1$, then differentiate for $y'(0)$.","answer":"$C_1=0$, then $y'(0)=3C_2=3$ gives $C_2=1$, so $y(x)=e^{-2x}\\\\sin(3x)$."}]}
```
