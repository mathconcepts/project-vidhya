---
# Alternative body for inner-product-spaces.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: inner-product-spaces.worked-example.assured
concept_id: inner-product-spaces
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: inner-product-spaces.worked_example
for_stance: assured
---

**Problem:** $u=(1,2,1)$, $v=(2,1,-1)$ in $\mathbb{R}^3$, standard inner product.

$$\langle u,v\rangle = 1(2)+2(1)+1(-1) = 3, \qquad \|u\|=\|v\|=\sqrt{6} \;\Rightarrow\; \|u\|\|v\|=6$$

$$\cos\theta = \frac{3}{6}=\frac12 \;\Rightarrow\; \boxed{\theta = \frac{\pi}{3}}$$

**Cauchy–Schwarz falls out immediately:** $|\langle u,v\rangle| = 3 \le 6 = \|u\|\|v\|$, with equality reserved for parallel vectors — worth a half-second glance whenever the exam hands you a computed inner product, since a violated inequality means an arithmetic slip upstream, not a paradox.

**Where the pattern reuses.** Swap the standard dot product for $\langle A,B\rangle=\operatorname{tr}(A^TB)$ or $\langle f,g\rangle=\int fg\,dx$ and this exact three-step recipe — inner product, norms, ratio — still finds the angle.

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Computing angle via inner product", "steps": [{"prompt": "First, compute the inner product $\\langle u, v \\rangle$ where $u = (1, 2, 1)$ and $v = (2, 1, -1)$. Multiply corresponding components and add.", "hint": "Standard inner product is component-wise multiplication summed: $(u_1 v_1 + u_2 v_2 + u_3 v_3)$.", "answer": "$\\langle u, v \\rangle = 1 \\cdot 2 + 2 \\cdot 1 + 1 \\cdot (-1) = 2 + 2 - 1 = 3$"}, {"prompt": "Next, compute $\\|u\\|$ and $\\|v\\|$ using $\\|w\\| = \\sqrt{\\langle w, w \\rangle}$.", "hint": "$\\|u\\| = \\sqrt{1^2 + 2^2 + 1^2} = \\sqrt{6}$ and $\\|v\\| = \\sqrt{2^2 + 1^2 + 1^2} = \\sqrt{6}$.", "answer": "$\\|u\\| = \\sqrt{6}$ and $\\|v\\| = \\sqrt{6}$, so $\\|u\\| \\|v\\| = 6$"}, {"prompt": "Now use the angle formula: $\\cos \\theta = \\frac{\\langle u, v \\rangle}{\\|u\\| \\|v\\|}$. Find $\\theta$.", "hint": "$\\cos \\theta = \\frac{3}{6} = \\frac{1}{2}$. What angle has cosine $\\frac{1}{2}$?", "answer": "$\\cos \\theta = \\frac{1}{2}$ implies $\\theta = \\frac{\\pi}{3}$ (60 degrees)"}], "caption": "The angle between two vectors emerges naturally from their inner product and norms."}
```
