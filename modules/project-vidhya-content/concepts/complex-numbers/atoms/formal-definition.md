---
id: complex-numbers.formal-definition
concept_id: complex-numbers
atom_type: formal_definition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

A complex number is $z = a + bi$ where $a, b \in \mathbb{R}$ and $i^2 = -1$. The set $\mathbb{C}$ forms a field with:

- **Addition:** $(a+bi) + (c+di) = (a+c) + (b+d)i$
- **Multiplication:** $(a+bi)(c+di) = (ac - bd) + (ad + bc)i$
- **Conjugate:** $\overline{a+bi} = a - bi$
- **Modulus:** $|a+bi| = \sqrt{a^2 + b^2}$

**Polar form:** $z = re^{i\theta}$ where $r = |z|$ and $\theta = \arg z$. Euler's identity: $e^{i\theta} = \cos\theta + i\sin\theta$.

**Which form to use.** Use polar form when the operation is multiplication, division, a power, or a root — $z_1z_2=r_1r_2e^{i(\theta_1+\theta_2)}$ turns those into arithmetic on $r$ and $\theta$. Don't reach for polar form to add or subtract: $re^{i\theta}+r'e^{i\theta'}$ has no clean closed form, while Cartesian addition is componentwise by definition — students who convert everything to polar out of habit do extra trigonometry for no benefit on a sum.
