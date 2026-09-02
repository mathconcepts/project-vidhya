---
id: gram-schmidt.worked-example
concept_id: gram-schmidt
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
scaffold_fade: true
exam_ids: ["*"]
---

**Problem.** Orthonormalize $v_1=(1,0,1)$, $v_2=(1,1,0)$, $v_3=(0,1,1)$.

---

**Step 1 — Take $u_1$ directly, then normalize.**

$u_1 = v_1 = (1,0,1)$, $\|u_1\| = \sqrt{2}$, so $e_1 = \left(\tfrac{1}{\sqrt2},0,\tfrac{1}{\sqrt2}\right)$.

---

**Step 2 — Strip $v_2$'s component along $e_1$.**

$\langle v_2,e_1\rangle = \tfrac{1}{\sqrt2}$, so $u_2 = v_2 - \tfrac{1}{\sqrt2}e_1 = (1,1,0)-\left(\tfrac12,0,\tfrac12\right) = \left(\tfrac12,1,-\tfrac12\right)$.

$\|u_2\| = \sqrt{\tfrac14+1+\tfrac14} = \sqrt{\tfrac32} = \tfrac{\sqrt6}{2}$, so $e_2 = \left(\tfrac{1}{\sqrt6},\tfrac{2}{\sqrt6},-\tfrac{1}{\sqrt6}\right)$.

---

**Step 3 — Strip $v_3$'s components along both $e_1$ and $e_2$.**

$\langle v_3,e_1\rangle = \tfrac{1}{\sqrt2}$, $\langle v_3,e_2\rangle = \tfrac{1}{\sqrt6}$.

$$u_3 = v_3 - \tfrac{1}{\sqrt2}e_1 - \tfrac{1}{\sqrt6}e_2 = \left(-\tfrac23,\tfrac23,\tfrac23\right)$$

$\|u_3\| = \sqrt{\tfrac{4}{9}\cdot3} = \tfrac{2}{\sqrt3}$, so $e_3 = \left(-\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3}\right)$.

---

**Check.** $e_1\cdot e_2 = \tfrac{1}{\sqrt{12}}+0-\tfrac{1}{\sqrt{12}}=0$; each $\|e_i\|=1$ by construction.

$$\boxed{e_1=\left(\tfrac{1}{\sqrt2},0,\tfrac{1}{\sqrt2}\right),\ e_2=\left(\tfrac{1}{\sqrt6},\tfrac{2}{\sqrt6},-\tfrac{1}{\sqrt6}\right),\ e_3=\left(-\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3}\right)}$$

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Gram-Schmidt on three vectors",
  "steps": [
    {
      "prompt": "Compute the norm of v1 = (1, 0, 1) and use it to normalize.",
      "hint": "||v1|| = sqrt(1 + 0 + 1). Then divide v1 by this norm to get e1.",
      "answer": "e1 = (1/sqrt(2), 0, 1/sqrt(2))"
    },
    {
      "prompt": "Compute <v2, e1>, subtract the projection from v2, and normalize the result.",
      "hint": "<v2, e1> = 1/sqrt(2). Form u2 = v2 − (1/sqrt(2)) e1, then normalize.",
      "answer": "e2 = (1/sqrt(6), 2/sqrt(6), −1/sqrt(6))"
    },
    {
      "prompt": "Compute <v3, e1> and <v3, e2>. Subtract both projections from v3 and normalize.",
      "hint": "Form u3 = v3 − <v3,e1> e1 − <v3,e2> e2. The result should be proportional to (−2/3, 2/3, 2/3).",
      "answer": "e3 = (−1/sqrt(3), 1/sqrt(3), 1/sqrt(3))"
    }
  ],
  "caption": "Follow the three steps of Gram-Schmidt: normalize v1, orthogonalize v2, then orthogonalize v3."
}
```
