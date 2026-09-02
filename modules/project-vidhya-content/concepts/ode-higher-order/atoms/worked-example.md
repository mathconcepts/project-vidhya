---
id: ode-higher-order.worked-example
concept_id: ode-higher-order
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

## Solve $y'''-6y''+11y'-6y=0$, $\;y(0)=3,\;y'(0)=6,\;y''(0)=14$

---

**Step 1 — Method selector.** Third order, linear, homogeneous, constant coefficients — the auxiliary-equation method applies directly, exactly as it would at order two. The one extra risk at higher order is stopping after finding *one* root: a tempting-but-wrong move is solving $r=1$ and writing $y=Ce^{x}$ as if the equation were done, when a degree-$3$ polynomial still has two more roots to find (by division) before the general solution is complete.

---

**Step 2 — Auxiliary equation.**
$$r^3-6r^2+11r-6=0$$

---

**Step 3 — Find the first root by inspection.** Try $r=1$: $1-6+11-6=0$ ✓.

---

**Step 4 — Divide out $(r-1)$.**
$$r^3-6r^2+11r-6=(r-1)(r^2-5r+6)=(r-1)(r-2)(r-3)$$
Roots: $r=1,2,3$ — all real, all distinct.

---

**Step 5 — General solution.**
$$y(x)=C_1e^{x}+C_2e^{2x}+C_3e^{3x}$$

---

**Step 6 — Apply $y(0)=3$.**
$$C_1+C_2+C_3=3$$

---

**Step 7 — Apply $y'(0)=6$.** $y'=C_1e^x+2C_2e^{2x}+3C_3e^{3x}$.
$$C_1+2C_2+3C_3=6$$

---

**Step 8 — Apply $y''(0)=14$.** $y''=C_1e^x+4C_2e^{2x}+9C_3e^{3x}$.
$$C_1+4C_2+9C_3=14$$

---

**Step 9 — Solve the $3\times3$ system.** (Eq.2 − Eq.1): $C_2+2C_3=3$. (Eq.3 − Eq.2): $2C_2+6C_3=8\Rightarrow C_2+3C_3=4$. Subtracting these: $C_3=1$, then $C_2=3-2(1)=1$, then $C_1=3-1-1=1$.

$$\boxed{y(x)=e^{x}+e^{2x}+e^{3x}}$$

---

**Step 10 — Check.** $y(0)=1+1+1=3$ ✓. $y'(0)=1+2+3=6$ ✓. $y''(0)=1+4+9=14$ ✓.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y''' - 6y'' + 11y' - 6y = 0 by the auxiliary equation","steps":[{"prompt":"Find one root of $r^3-6r^2+11r-6=0$ by testing small integers.","hint":"Try $r=1$ first.","answer":"$r=1$ works: $1-6+11-6=0$."},{"prompt":"Divide out $(r-1)$ and factor the remaining quadratic.","hint":"$r^3-6r^2+11r-6=(r-1)(r^2-5r+6)$ — factor the quadratic.","answer":"$(r-1)(r-2)(r-3)=0$, so $r=1,2,3$."},{"prompt":"Given $y(0)=3,\\\\;y'(0)=6,\\\\;y''(0)=14$, solve the $3\\\\times3$ linear system for $C_1,C_2,C_3$.","hint":"Subtract consecutive equations to eliminate $C_1$, then eliminate $C_2$.","answer":"$C_1=C_2=C_3=1$, giving $y=e^x+e^{2x}+e^{3x}$."}]}
```
