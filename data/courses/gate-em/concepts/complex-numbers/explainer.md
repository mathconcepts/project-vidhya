# Complex Numbers
> GATE Engineering Mathematics | Complex Variables | medium frequency | difficulty: 0.3

## Intuition First
Imagine rotating and scaling points on a plane simultaneously — that's what complex numbers do. A complex number $z = a + bi$ represents a point at horizontal distance $a$ and vertical distance $b$. Multiplication by $i$ rotates by 90°; multiplication by $2$ stretches the distance to the origin by 2×.

## Core Definition
**Euler's Formula & Polar Form**: For any complex number $z = x + iy$ with $x, y \in \mathbb{R}$, we express it as $z = r e^{i\theta} = r(\cos\theta + i\sin\theta)$, where $r = |z| = \sqrt{x^2 + y^2}$ is the modulus (distance from origin) and $\theta = \arg(z)$ is the argument (angle from positive real axis). The operations satisfy:
- **Addition**: $(a + bi) + (c + di) = (a+c) + (b+d)i$ (vector addition in the plane)
- **Multiplication**: $(a + bi)(c + di) = (ac - bd) + (ad + bc)i$ (combines rotation and scaling)
- **Complex Conjugate**: $\overline{z} = x - iy$ (reflection across the real axis)

## What Happens (Worked Example)
Label: "**What happens:**"

Given $z_1 = 3 + 4i$ and $z_2 = 1 + 2i$, compute:
1. $|z_1| = \sqrt{3^2 + 4^2} = \sqrt{9 + 16} = 5$ ✓ The distance from origin to $(3, 4)$ is 5 units.
2. $\arg(z_1) = \arctan(4/3) \approx 53.13°$ ✓ The angle from the positive real axis to $(3,4)$ is approximately 53°.
3. $z_1 \cdot z_2 = (3+4i)(1+2i) = 3 + 6i + 4i + 8i^2 = 3 + 10i - 8 = -5 + 10i$ ✓ Geometrically, we rotated and scaled $z_2$ by the angle and magnitude of $z_1$.
4. $\overline{z_1} = 3 - 4i$ ✓ This flips $(3,4)$ across the real axis to $(3,-4)$.

Label: "**Why it works:**"
The complex plane embeds multiplication as a rotation-scaling operation: if $z_1 = r_1 e^{i\theta_1}$ and $z_2 = r_2 e^{i\theta_2}$, then $z_1 z_2 = r_1 r_2 e^{i(\theta_1 + \theta_2)}$. This means we scale by the product of magnitudes ($r_1 r_2$) and rotate by the sum of arguments ($\theta_1 + \theta_2$). The conjugate flips the sign of the imaginary component, reversing the rotation.

## GATE MA Relevance
> **Why it matters in GATE MA:** Complex numbers appear in every GATE MA paper in 1–2 NAT/MCQ questions on modulus, argument, polar form conversion, and De Moivre's theorem. Understanding the geometric interpretation (rotation/scaling) makes problems involving products and powers intuitive and fast.
