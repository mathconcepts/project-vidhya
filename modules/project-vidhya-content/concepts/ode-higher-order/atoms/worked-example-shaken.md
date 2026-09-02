---
# for_stance: shaken — same problem, terse steps, full arithmetic shown, explicit check.
id: ode-higher-order.worked-example.shaken
concept_id: ode-higher-order
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-higher-order.worked-example
for_stance: shaken
---

$y'''-6y''+11y'-6y=0$, $y(0)=3$, $y'(0)=6$, $y''(0)=14$.

Auxiliary equation: $r^3-6r^2+11r-6=0$. Test $r=1$: $1-6+11-6=0$ ✓.

Divide: $r^3-6r^2+11r-6=(r-1)(r^2-5r+6)=(r-1)(r-2)(r-3)$. Roots: $1,2,3$.

$$y=C_1e^{x}+C_2e^{2x}+C_3e^{3x}$$

Apply $y(0)=3$: $C_1+C_2+C_3=3$.

Apply $y'(0)=6$: $y'=C_1e^x+2C_2e^{2x}+3C_3e^{3x}$, so $C_1+2C_2+3C_3=6$.

Apply $y''(0)=14$: $y''=C_1e^x+4C_2e^{2x}+9C_3e^{3x}$, so $C_1+4C_2+9C_3=14$.

Subtract pairs: $C_2+2C_3=3$ and $C_2+3C_3=4$, so $C_3=1$, $C_2=1$, $C_1=1$.

$$\boxed{y(x)=e^{x}+e^{2x}+e^{3x}}$$

Check: $y(0)=3$, $y'(0)=6$, $y''(0)=14$. All three match.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y''' - 6y'' + 11y' - 6y = 0 by the auxiliary equation","steps":[{"prompt":"Find one root of $r^3-6r^2+11r-6=0$ by testing small integers.","hint":"Try $r=1$ first.","answer":"$r=1$ works: $1-6+11-6=0$."},{"prompt":"Divide out $(r-1)$ and factor the remaining quadratic.","hint":"$r^3-6r^2+11r-6=(r-1)(r^2-5r+6)$ — factor the quadratic.","answer":"$(r-1)(r-2)(r-3)=0$, so $r=1,2,3$."},{"prompt":"Given $y(0)=3,\\\\;y'(0)=6,\\\\;y''(0)=14$, solve the $3\\\\times3$ linear system for $C_1,C_2,C_3$.","hint":"Subtract consecutive equations to eliminate $C_1$, then eliminate $C_2$.","answer":"$C_1=C_2=C_3=1$, giving $y=e^x+e^{2x}+e^{3x}$."}]}
```
