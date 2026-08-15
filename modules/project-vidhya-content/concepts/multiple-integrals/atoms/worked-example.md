---
id: multiple-integrals.worked-example
concept_id: multiple-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Double Integral with Change of Variables

## Problem

Evaluate the double integral:
$$\iint_R e^{-(x^2+y^2)} \, dA$$
where $R$ is the region defined by $x^2 + y^2 \leq 1$ (the unit disk).

## Solution

**Step 1: Recognize the symmetry**

The integrand $e^{-(x^2+y^2)}$ depends only on the distance from the origin, $r = \sqrt{x^2+y^2}$. This is a strong signal to use **polar coordinates**.

**Step 2: Convert to polar coordinates**

In polar coordinates:
- $x = r\cos\theta$
- $y = r\sin\theta$
- $x^2 + y^2 = r^2$
- $dA = r \, dr \, d\theta$ (Jacobian)

The region $x^2 + y^2 \leq 1$ becomes $0 \leq r \leq 1$ and $0 \leq \theta \leq 2\pi$.

**Step 3: Substitute and rewrite the integral**

$$\iint_R e^{-(x^2+y^2)} \, dA = \int_0^{2\pi} \int_0^1 e^{-r^2} \cdot r \, dr \, d\theta$$

**Step 4: Evaluate the inner integral**

$$\int_0^1 r e^{-r^2} \, dr$$

Substitute $u = -r^2$, so $du = -2r \, dr$:
$$\int_0^1 r e^{-r^2} \, dr = -\frac{1}{2} \int_0^{-1} e^u \, du = -\frac{1}{2}[e^u]_0^{-1} = -\frac{1}{2}(e^{-1} - 1) = \frac{1}{2}(1 - e^{-1})$$

**Step 5: Evaluate the outer integral**

$$\int_0^{2\pi} \frac{1}{2}(1 - e^{-1}) \, d\theta = \frac{1}{2}(1 - e^{-1}) \cdot 2\pi = \pi(1 - e^{-1})$$

**Final Answer:** $\pi(1 - e^{-1})$ or $\pi(1 - 1/e)$

## Key Exam Insight

When you see $x^2 + y^2$ in the integrand or region, **always consider polar coordinates**. The Jacobian $r \, dr \, d\theta$ appears naturally and often simplifies the integral dramatically.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Double integral in polar coordinates","steps":[{"prompt":"Step 1: What symmetry do you notice in $e^{-(x^2+y^2)}$?","hint":"The exponent involves $x^2 + y^2$. What does this quantity represent geometrically?","answer":"The integrand depends only on distance from the origin: $r = \\sqrt{x^2+y^2}$. This suggests using polar coordinates."},{"prompt":"Step 2: Write the Jacobian for the transformation from Cartesian to polar coordinates.","hint":"Remember: $x = r\\cos\\theta$, $y = r\\sin\\theta$. The area element changes by a factor equal to the absolute value of the determinant of the Jacobian matrix.","answer":"$dA = r \\, dr \\, d\\theta$ (the Jacobian factor is $r$)"},{"prompt":"Step 3: Set up the bounds. For the unit disk $x^2+y^2 \\leq 1$, what are the limits on $r$ and $\\theta$?","hint":"The radius ranges from the center to the boundary circle. The angle sweeps all the way around.","answer":"$0 \\leq r \\leq 1$ and $0 \\leq \\theta \\leq 2\\pi$"}],"caption":"Master polar coordinates: the key to solving radially symmetric integrals efficiently."}
```

DONE:multiple-integrals
