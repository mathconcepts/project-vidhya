---
id: differential-equations-jee.worked-example.assured
concept_id: differential-equations-jee
atom_type: worked_example
scaffold_fade: true
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
variant_of: differential-equations-jee.worked_example
for_stance: assured
---

## The classification, not just the solve

$\dfrac{dy}{dx}=\dfrac{x+y}{x-y}$ fails separability outright ($x,y$ combine additively, not as a ratio) but passes the homogeneity test cleanly: $\lambda x,\lambda y$ cancel every $\lambda$, confirming degree $0$. Substitute $y=vx$:

$$x\frac{dv}{dx}=\frac{1+v^2}{1-v} \;\Rightarrow\; \frac{1-v}{1+v^2}\,dv=\frac{dx}{x} \;\Rightarrow\; \arctan v-\frac{1}{2}\ln(1+v^2)=\ln|x|+C$$

Back-substituting $v=y/x$ and absorbing $\ln|x|$:

$$\boxed{\arctan\frac{y}{x}-\frac{1}{2}\ln(x^2+y^2)=C}$$

## The distinction worth keeping

A homogeneous equation is not "any equation with $x$ and $y$ mixed together" — it is specifically one where EVERY term scales identically under $x\to\lambda x,\,y\to\lambda y$. $\dfrac{dy}{dx}=\dfrac{x^2+y}{x-y}$ looks almost identical to this problem but fails the test: $x^2$ scales as $\lambda^2$ while $y$ scales as $\lambda^1$, so no common power of $\lambda$ factors out, and $y=vx$ does not reduce it to a separable equation in $v$ and $x$ at all.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving a homogeneous DE by substitution","why":"Checking separability first, and failing it deliberately, confirms homogeneity is the right next test — skipping straight to substitution wastes time without ruling out simpler methods.","steps":[{"prompt":"Can dy/dx = (x+y)/(x-y) be separated into g(y)dy = h(x)dx?","hint":"x and y are added together on both top and bottom.","answer":"No — separation is impossible here, not just inconvenient."},{"prompt":"Test homogeneity: replace x with λx and y with λy. What happens?","hint":"Every term gets a factor of λ.","answer":"The λ's cancel completely — the equation is homogeneous."},{"prompt":"Substitute y=vx. What does dy/dx become?","hint":"Product rule: y=vx means dy/dx = v + x dv/dx.","answer":"v + x·dv/dx = (1+v)/(1-v)"},{"prompt":"Separate the resulting equation in v and x, then integrate.","hint":"Rearrange to (1-v)/(1+v²) dv = dx/x.","answer":"arctan(v) − (1/2)ln(1+v²) = ln|x| + C"},{"prompt":"Substitute v=y/x back and simplify.","hint":"ln(1+v²) becomes ln(x²+y²) − 2ln|x|.","answer":"arctan(y/x) − (1/2)ln(x²+y²) = C"}],"caption":"Test separability, then homogeneity, in that order — each test that fails still tells you which method to try next."}
```
