---
id: ode-second-order-homo.worked-example
concept_id: ode-second-order-homo
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

## Solve $y''+4y'+13y=0$, $\;y(0)=0,\;y'(0)=3$

---

**Step 1 — Method selector.** The equation is linear, homogeneous, constant-coefficient — the characteristic-equation method applies directly. A tempting-but-wrong move here is reaching for undetermined coefficients or variation of parameters because "second-order ODE" pattern-matches those names: both methods build a *particular* solution against a nonzero right-hand side, and this equation's right-hand side is identically $0$ — there is nothing to match, only the characteristic equation to solve.

---

**Step 2 — Characteristic equation.**
$$r^2+4r+13=0$$

---

**Step 3 — Solve for the roots.**
$$r=\frac{-4\pm\sqrt{16-52}}{2}=\frac{-4\pm\sqrt{-36}}{2}=-2\pm3i$$

Complex pair: $\alpha=-2$, $\beta=3$.

---

**Step 4 — Write the general solution.**
$$y(x)=e^{-2x}\left(C_1\cos3x+C_2\sin3x\right)$$

---

**Step 5 — Apply $y(0)=0$.**
$$y(0)=e^{0}(C_1\cos0+C_2\sin0)=C_1=0$$

---

**Step 6 — Apply $y'(0)=3$.** Differentiate first:
$$y'(x)=e^{-2x}\big[-2(C_1\cos3x+C_2\sin3x)+(-3C_1\sin3x+3C_2\cos3x)\big]$$

At $x=0$, with $C_1=0$:
$$y'(0)=-2(0)+3C_2=3C_2=3\;\implies\;C_2=1$$

---

**Step 7 — Final answer.**
$$\boxed{y(x)=e^{-2x}\sin(3x)}$$

---

**Step 8 — Check.** $y(0)=\sin0=0$ ✓. $y'(x)=e^{-2x}(3\cos3x-2\sin3x)$, so $y'(0)=3(1)-2(0)=3$ ✓. Both conditions hold, and substituting back confirms $y''+4y'+13y\equiv0$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y'' + 4y' + 13y = 0 by characteristic roots","steps":[{"prompt":"Write the characteristic equation for $y''+4y'+13y=0$.","hint":"Replace $y''$ with $r^2$, $y'$ with $r$, $y$ with $1$.","answer":"$r^2+4r+13=0$."},{"prompt":"Solve for the roots using the quadratic formula.","hint":"Compute the discriminant $16-52$ first — it is negative, so expect a complex pair.","answer":"$r=\\\\dfrac{-4\\\\pm\\\\sqrt{-36}}{2}=-2\\\\pm3i$."},{"prompt":"Given $y(0)=0$ and $y'(0)=3$, find the particular solution.","hint":"General solution is $y=e^{-2x}(C_1\\\\cos3x+C_2\\\\sin3x)$. Use $y(0)=0$ first to get $C_1$, then differentiate for $y'(0)$.","answer":"$C_1=0$, then $y'(0)=3C_2=3$ gives $C_2=1$, so $y(x)=e^{-2x}\\\\sin(3x)$."}]}
```
