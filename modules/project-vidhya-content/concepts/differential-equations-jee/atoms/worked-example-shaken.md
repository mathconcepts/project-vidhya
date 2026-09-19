---
id: differential-equations-jee.worked-example.shaken
concept_id: differential-equations-jee
atom_type: worked_example
scaffold_fade: true
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
variant_of: differential-equations-jee.worked_example
for_stance: shaken
---

## The equation

$\dfrac{dy}{dx}=\dfrac{x+y}{x-y}$.

**Check separable? No.** $x$ and $y$ are added together, top and bottom. Cannot split into $g(y)dy=h(x)dx$.

**Check homogeneous? Yes.** Replace $x\to\lambda x$, $y\to\lambda y$: every $\lambda$ cancels. Homogeneous confirmed.

**Substitute $y=vx$.** $\dfrac{dy}{dx}=v+x\dfrac{dv}{dx}$. Right side becomes $\dfrac{1+v}{1-v}$.

$$x\frac{dv}{dx}=\frac{1+v}{1-v}-v=\frac{1+v^2}{1-v}$$

**Separate and integrate.**

$$\frac{1-v}{1+v^2}\,dv=\frac{dx}{x}$$

$$\arctan v-\frac{1}{2}\ln(1+v^2)=\ln|x|+C$$

**Substitute back $v=y/x$.**

$$\boxed{\arctan\frac{y}{x}-\frac{1}{2}\ln(x^2+y^2)=C}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving a homogeneous DE by substitution","why":"Checking separability first, and failing it deliberately, confirms homogeneity is the right next test — skipping straight to substitution wastes time without ruling out simpler methods.","steps":[{"prompt":"Can dy/dx = (x+y)/(x-y) be separated into g(y)dy = h(x)dx?","hint":"x and y are added together on both top and bottom.","answer":"No — separation is impossible here, not just inconvenient."},{"prompt":"Test homogeneity: replace x with λx and y with λy. What happens?","hint":"Every term gets a factor of λ.","answer":"The λ's cancel completely — the equation is homogeneous."},{"prompt":"Substitute y=vx. What does dy/dx become?","hint":"Product rule: y=vx means dy/dx = v + x dv/dx.","answer":"v + x·dv/dx = (1+v)/(1-v)"},{"prompt":"Separate the resulting equation in v and x, then integrate.","hint":"Rearrange to (1-v)/(1+v²) dv = dx/x.","answer":"arctan(v) − (1/2)ln(1+v²) = ln|x| + C"},{"prompt":"Substitute v=y/x back and simplify.","hint":"ln(1+v²) becomes ln(x²+y²) − 2ln|x|.","answer":"arctan(y/x) − (1/2)ln(x²+y²) = C"}],"caption":"Test separability, then homogeneity, in that order — each test that fails still tells you which method to try next."}
```
