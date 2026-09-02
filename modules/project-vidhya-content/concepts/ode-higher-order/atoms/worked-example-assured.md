---
# for_stance: assured — the one distinction that costs marks: a third-order IVP needs three conditions, not two — second-order muscle memory drops the third.
id: ode-higher-order.worked-example.assured
concept_id: ode-higher-order
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-higher-order.worked-example
for_stance: assured
---

A third-order IVP needs exactly three conditions — $y(x_0),y'(x_0),y''(x_0)$ — not two. Muscle memory from second-order problems sometimes stops after applying two conditions and reports an answer with one constant still free; here, skipping $y''(0)=14$ would leave $C_1+C_2+C_3=3$ and $C_1+2C_2+3C_3=6$ satisfied by an entire line of $(C_1,C_2,C_3)$ triples, not the single point $C_1=C_2=C_3=1$. The order of the ODE is exactly the count of independent conditions a well-posed IVP requires — match them one-to-one before solving the linear system.

$$\boxed{y(x)=e^{x}+e^{2x}+e^{3x}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y''' - 6y'' + 11y' - 6y = 0 by the auxiliary equation","steps":[{"prompt":"Find one root of $r^3-6r^2+11r-6=0$ by testing small integers.","hint":"Try $r=1$ first.","answer":"$r=1$ works: $1-6+11-6=0$."},{"prompt":"Divide out $(r-1)$ and factor the remaining quadratic.","hint":"$r^3-6r^2+11r-6=(r-1)(r^2-5r+6)$ — factor the quadratic.","answer":"$(r-1)(r-2)(r-3)=0$, so $r=1,2,3$."},{"prompt":"Given $y(0)=3,\\\\;y'(0)=6,\\\\;y''(0)=14$, solve the $3\\\\times3$ linear system for $C_1,C_2,C_3$.","hint":"Subtract consecutive equations to eliminate $C_1$, then eliminate $C_2$.","answer":"$C_1=C_2=C_3=1$, giving $y=e^x+e^{2x}+e^{3x}$."}]}
```
