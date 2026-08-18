---
# Alternative body for inner-product-spaces.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The scaffolding is REAL but it is not on the page: prose is held at or below
# the base atom's length, because a screen that is visibly longer than the one
# that already defeated this reader signals difficulty no matter how kindly it
# is written. The extra steps live in the walkthrough below, where they unfold
# one at a time when the student asks for them.
#
# The walkthrough may carry MORE steps than the base's, but every answer the
# base asserts survives here in order and the final answer is identical —
# scripts/check-variant-agreement.ts enforces that. Prompts and hints are the
# part that may differ, and they are where the gentler register lives.
id: inner-product-spaces.worked-example.shaken
concept_id: inner-product-spaces
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: inner-product-spaces.worked_example
for_stance: shaken
---

**Problem:** $u = (1, 2, 1)$, $v = (2, 1, -1)$ in $\mathbb{R}^3$. Find $\langle u,v\rangle$, then the angle between $u$ and $v$.

---

**Step 1 — Multiply matching components, add them.**

$$\langle u, v \rangle = (1)(2) + (2)(1) + (1)(-1) = 2 + 2 - 1 = 3$$

---

**Step 2 — Find each length: $\|w\| = \sqrt{\langle w,w\rangle}$.**

$$\|u\| = \sqrt{1^2+2^2+1^2} = \sqrt{6}, \qquad \|v\| = \sqrt{2^2+1^2+(-1)^2} = \sqrt{6}$$

So $\|u\|\|v\| = 6$.

---

**Step 3 — Plug into $\cos\theta = \dfrac{\langle u,v\rangle}{\|u\|\|v\|}$.**

$$\cos\theta = \frac{3}{6} = \frac{1}{2} \quad\Rightarrow\quad \theta = \frac{\pi}{3}$$

**Answer:** $\boxed{\langle u, v \rangle = 3; \quad \theta = \frac{\pi}{3}}$

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Computing angle via inner product", "steps": [{"prompt": "Multiply component 1 by component 1, component 2 by component 2, component 3 by component 3, then add all three. What do you get for $\\langle u, v \\rangle$?", "hint": "$u = (1, 2, 1)$, $v = (2, 1, -1)$. Line them up and multiply pairwise: $1\\cdot2$, then $2\\cdot1$, then $1\\cdot(-1)$.", "answer": "$\\langle u, v \\rangle = 1 \\cdot 2 + 2 \\cdot 1 + 1 \\cdot (-1) = 2 + 2 - 1 = 3$"}, {"prompt": "Square each component of $u$, add, take the square root. Repeat for $v$.", "hint": "$\\|u\\| = \\sqrt{1^2 + 2^2 + 1^2}$ and $\\|v\\| = \\sqrt{2^2 + 1^2 + 1^2}$ — note the squares erase the minus sign on $v$'s last entry.", "answer": "$\\|u\\| = \\sqrt{6}$ and $\\|v\\| = \\sqrt{6}$, so $\\|u\\| \\|v\\| = 6$"}, {"prompt": "Divide the inner product from Step 1 by $\\|u\\|\\|v\\|$ from Step 2. What angle has that cosine?", "hint": "$\\cos \\theta = \\frac{3}{6} = \\frac{1}{2}$. Recall which standard angle gives $\\cos\\theta=\\frac12$.", "answer": "$\\cos \\theta = \\frac{1}{2}$ implies $\\theta = \\frac{\\pi}{3}$ (60 degrees)"}], "caption": "The angle between two vectors emerges naturally from their inner product and norms."}
```
