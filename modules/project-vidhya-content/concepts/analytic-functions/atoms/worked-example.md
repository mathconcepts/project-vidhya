---
id: analytic-functions.worked-example
concept_id: analytic-functions
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Given $u(x,y) = e^x\cos y$, find the harmonic conjugate $v(x,y)$ so that $f=u+iv$ is analytic, and write $f$ as a function of $z$.

---

**Step 1 — Confirm $u$ is harmonic.** $u_x=e^x\cos y$, $u_{xx}=e^x\cos y$; $u_y=-e^x\sin y$, $u_{yy}=-e^x\cos y$. Sum: $u_{xx}+u_{yy}=0$ ✓ — a conjugate can exist.

---

**Step 2 — Use the first CR equation.** $v_y=u_x=e^x\cos y$. Integrate with respect to $y$: $v = e^x\sin y + g(x)$, for some function $g$ of $x$ alone.

---

**Step 3 — Use the second CR equation to pin down $g$.** $v_x=-u_y \Rightarrow e^x\sin y + g'(x) = e^x\sin y \Rightarrow g'(x)=0 \Rightarrow g(x)=C$.

---

**Step 4 — Assemble $f$.** $f(z)=u+iv=e^x\cos y+i(e^x\sin y+C)=e^x(\cos y+i\sin y)+iC=e^{x+iy}+iC$. Taking $C=0$: $\boxed{f(z)=e^z}$. Sanity check: $f'(z)=u_x+iv_x=e^x\cos y+ie^x\sin y=e^z$, matching $\frac{d}{dz}e^z=e^z$ directly.

**Method note.** Integrate $v_y=u_x$ to reconstruct $v$, then fix the leftover function of $x$ with $v_x=-u_y$ — this always produces $v$ directly. Guessing a $v$ that "looks harmonic" and checking it afterward wastes time searching when the two-equation integration hands you the unique answer (up to the additive constant CR always leaves free) in two lines.
