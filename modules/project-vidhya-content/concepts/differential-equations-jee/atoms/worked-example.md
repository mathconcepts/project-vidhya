---
id: differential-equations-jee.worked_example
concept_id: differential-equations-jee
atom_type: worked_example
scaffold_fade: true
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
---

## Problem

Solve $\dfrac{dy}{dx}=\dfrac{x+y}{x-y}$.

---

**Step 1: Check separability first — it fails, and it is worth seeing why.**

For $g(y)\,dy=h(x)\,dx$, the right side would need to split as a pure function of $x$ times a pure function of $y$. Here $x$ and $y$ appear ADDED together in both numerator and denominator — no algebraic rearrangement separates them. Separation is ruled out, not merely inconvenient.

**Step 2: Test for homogeneity.**

Replace $x\to\lambda x$, $y\to\lambda y$: $\dfrac{\lambda x+\lambda y}{\lambda x-\lambda y}=\dfrac{\lambda(x+y)}{\lambda(x-y)}=\dfrac{x+y}{x-y}$ — the $\lambda$'s cancel completely, so the right side is a function of $y/x$ alone (degree $0$). The equation is homogeneous — substitute $y=vx$.

**Step 3: Substitute and simplify.**

With $y=vx$, $\dfrac{dy}{dx}=v+x\dfrac{dv}{dx}$. The right side becomes $\dfrac{x+vx}{x-vx}=\dfrac{1+v}{1-v}$. So:

$$v+x\frac{dv}{dx}=\frac{1+v}{1-v} \;\Rightarrow\; x\frac{dv}{dx}=\frac{1+v}{1-v}-v=\frac{1+v-v(1-v)}{1-v}=\frac{1+v^2}{1-v}$$

**Step 4: This is now separable — separate and integrate.**

$$\frac{1-v}{1+v^2}\,dv=\frac{dx}{x} \;\Rightarrow\; \int\frac{1}{1+v^2}\,dv-\int\frac{v}{1+v^2}\,dv=\int\frac{dx}{x}$$

$$\arctan v - \frac{1}{2}\ln(1+v^2) = \ln|x| + C$$

**Step 5: Substitute back $v=y/x$ and simplify.**

$\ln(1+v^2)=\ln\!\left(1+\dfrac{y^2}{x^2}\right)=\ln(x^2+y^2)-2\ln|x|$, so:

$$\arctan\frac{y}{x} - \frac{1}{2}\big[\ln(x^2+y^2)-2\ln|x|\big] = \ln|x|+C \;\Rightarrow\; \arctan\frac{y}{x} - \frac{1}{2}\ln(x^2+y^2) = C$$

$$\boxed{\arctan\frac{y}{x} - \frac{1}{2}\ln(x^2+y^2) = C}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving a homogeneous DE by substitution","why":"Checking separability first, and failing it deliberately, confirms homogeneity is the right next test — skipping straight to substitution wastes time without ruling out simpler methods.","steps":[{"prompt":"Can dy/dx = (x+y)/(x-y) be separated into g(y)dy = h(x)dx?","hint":"x and y are added together on both top and bottom.","answer":"No — separation is impossible here, not just inconvenient."},{"prompt":"Test homogeneity: replace x with λx and y with λy. What happens?","hint":"Every term gets a factor of λ.","answer":"The λ's cancel completely — the equation is homogeneous."},{"prompt":"Substitute y=vx. What does dy/dx become?","hint":"Product rule: y=vx means dy/dx = v + x dv/dx.","answer":"v + x·dv/dx = (1+v)/(1-v)"},{"prompt":"Separate the resulting equation in v and x, then integrate.","hint":"Rearrange to (1-v)/(1+v²) dv = dx/x.","answer":"arctan(v) − (1/2)ln(1+v²) = ln|x| + C"},{"prompt":"Substitute v=y/x back and simplify.","hint":"ln(1+v²) becomes ln(x²+y²) − 2ln|x|.","answer":"arctan(y/x) − (1/2)ln(x²+y²) = C"}],"caption":"Test separability, then homogeneity, in that order — each test that fails still tells you which method to try next."}
```
