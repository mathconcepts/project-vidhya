---
# Alternative body for gram-schmidt.worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The scaffolding is REAL but it is not on the page: prose is held at or below
# the base atom's length, because a screen that is visibly longer than the one
# that already defeated this reader signals difficulty no matter how kindly it
# is written. No praise, no reassurance, and no mention of how the reader
# might be feeling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: gram-schmidt.worked-example.shaken
concept_id: gram-schmidt
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
scaffold_fade: true
exam_ids: ["*"]
variant_of: gram-schmidt.worked-example
for_stance: shaken
---

Orthonormalize $v_1=(1,0,1)$, $v_2=(1,1,0)$, $v_3=(0,1,1)$.

---

**Step 1 — normalize $v_1$.**

$\|v_1\| = \sqrt{1+0+1} = \sqrt2$, so $e_1 = \left(\tfrac{1}{\sqrt2},0,\tfrac{1}{\sqrt2}\right)$.

---

**Step 2 — remove $v_2$'s part along $e_1$, normalize.**

$\langle v_2,e_1\rangle = \tfrac{1}{\sqrt2}$. Subtract: $u_2=\left(\tfrac12,1,-\tfrac12\right)$. Divide by $\|u_2\|=\tfrac{\sqrt6}{2}$: $e_2=\left(\tfrac{1}{\sqrt6},\tfrac{2}{\sqrt6},-\tfrac{1}{\sqrt6}\right)$.

---

**Step 3 — remove $v_3$'s part along $e_1$ and $e_2$.**

$\langle v_3,e_1\rangle=\tfrac{1}{\sqrt2}$, $\langle v_3,e_2\rangle=\tfrac{1}{\sqrt6}$. Subtract both: $u_3=\left(-\tfrac23,\tfrac23,\tfrac23\right)$. Divide by $\|u_3\|=\tfrac{2}{\sqrt3}$: $e_3=\left(-\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3}\right)$.

---

**Check.** $e_1\cdot e_2 = \tfrac{1}{\sqrt{12}}-\tfrac{1}{\sqrt{12}}=0$.

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
