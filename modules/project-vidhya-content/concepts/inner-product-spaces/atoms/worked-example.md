---
id: inner-product-spaces.worked_example
concept_id: inner-product-spaces
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
---

**Problem:** In $\mathbb{R}^3$ with the standard inner product, let $u = (1, 2, 1)$ and $v = (2, 1, -1)$. 

(a) Compute $\langle u, v \rangle$.

(b) Verify that the Cauchy–Schwarz inequality holds.

(c) Find the angle $\theta$ between $u$ and $v$.

---

**Step 1:** Compute the inner product $\langle u, v \rangle$.

Using the standard inner product in $\mathbb{R}^3$:
$$\langle u, v \rangle = (1)(2) + (2)(1) + (1)(-1) = 2 + 2 - 1 = 3$$

---

**Step 2:** Verify Cauchy–Schwarz by computing the norms and checking $|\langle u, v \rangle| \leq \|u\| \|v\|$.

$$\|u\| = \sqrt{1^2 + 2^2 + 1^2} = \sqrt{6}$$
$$\|v\| = \sqrt{2^2 + 1^2 + (-1)^2} = \sqrt{6}$$
$$\|u\| \|v\| = 6$$

Since $|\langle u, v \rangle| = 3 \leq 6 = \|u\| \|v\|$, Cauchy–Schwarz holds. ✓

---

**Step 3:** Find the angle using $\cos \theta = \frac{\langle u, v \rangle}{\|u\| \|v\|}$.

$$\cos \theta = \frac{3}{6} = \frac{1}{2}$$
$$\theta = \arccos\left(\frac{1}{2}\right) = \frac{\pi}{3} \text{ (or } 60°\text{)}$$

**Answer:** $\boxed{\langle u, v \rangle = 3; \quad \theta = \frac{\pi}{3}}$

---

**Interactive Guide:**

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Computing angle via inner product", "steps": [{"prompt": "First, compute the inner product $\\langle u, v \\rangle$ where $u = (1, 2, 1)$ and $v = (2, 1, -1)$. Multiply corresponding components and add.", "hint": "Standard inner product is component-wise multiplication summed: $(u_1 v_1 + u_2 v_2 + u_3 v_3)$.", "answer": "$\\langle u, v \\rangle = 1 \\cdot 2 + 2 \\cdot 1 + 1 \\cdot (-1) = 2 + 2 - 1 = 3$"}, {"prompt": "Next, compute $\\|u\\|$ and $\\|v\\|$ using $\\|w\\| = \\sqrt{\\langle w, w \\rangle}$.", "hint": "$\\|u\\| = \\sqrt{1^2 + 2^2 + 1^2} = \\sqrt{6}$ and $\\|v\\| = \\sqrt{2^2 + 1^2 + 1^2} = \\sqrt{6}$.", "answer": "$\\|u\\| = \\sqrt{6}$ and $\\|v\\| = \\sqrt{6}$, so $\\|u\\| \\|v\\| = 6$"}, {"prompt": "Now use the angle formula: $\\cos \\theta = \\frac{\\langle u, v \\rangle}{\\|u\\| \\|v\\|}$. Find $\\theta$.", "hint": "$\\cos \\theta = \\frac{3}{6} = \\frac{1}{2}$. What angle has cosine $\\frac{1}{2}$?", "answer": "$\\cos \\theta = \\frac{1}{2}$ implies $\\theta = \\frac{\\pi}{3}$ (60 degrees)"}], "caption": "The angle between two vectors emerges naturally from their inner product and norms."}
```