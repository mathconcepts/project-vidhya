---
id: interpolation.worked_example
concept_id: interpolation
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Worked Example: Lagrange Interpolation with Three Points

**Problem (GATE-style):**

You have experimental measurements at three points:
- $f(1) = 2$
- $f(2) = 4$
- $f(3) = 8$

Using Lagrange interpolation, find the value of the interpolating polynomial at $x = 1.5$.

**Solution:**

The Lagrange interpolating polynomial through three points is:

$$P(x) = f(x_1) \frac{(x-x_2)(x-x_3)}{(x_1-x_2)(x_1-x_3)} + f(x_2) \frac{(x-x_1)(x-x_3)}{(x_2-x_1)(x_2-x_3)} + f(x_3) \frac{(x-x_1)(x-x_2)}{(x_3-x_1)(x_3-x_2)}$$

With $x_1=1, x_2=2, x_3=3$ and $f(x_1)=2, f(x_2)=4, f(x_3)=8$:

**Basis polynomial $L_1(x)$:**
$$L_1(x) = \frac{(x-2)(x-3)}{(1-2)(1-3)} = \frac{(x-2)(x-3)}{(-1)(-2)} = \frac{(x-2)(x-3)}{2}$$

**Basis polynomial $L_2(x)$:**
$$L_2(x) = \frac{(x-1)(x-3)}{(2-1)(2-3)} = \frac{(x-1)(x-3)}{(1)(-1)} = -(x-1)(x-3)$$

**Basis polynomial $L_3(x)$:**
$$L_3(x) = \frac{(x-1)(x-2)}{(3-1)(3-2)} = \frac{(x-1)(x-2)}{(2)(1)} = \frac{(x-1)(x-2)}{2}$$

**Evaluate at $x = 1.5$:**

$$L_1(1.5) = \frac{(1.5-2)(1.5-3)}{2} = \frac{(-0.5)(-1.5)}{2} = \frac{0.75}{2} = 0.375$$

$$L_2(1.5) = -(1.5-1)(1.5-3) = -(0.5)(-1.5) = 0.75$$

$$L_3(1.5) = \frac{(1.5-1)(1.5-2)}{2} = \frac{(0.5)(-0.5)}{2} = \frac{-0.25}{2} = -0.125$$

**Final result:**
$$P(1.5) = 2(0.375) + 4(0.75) + 8(-0.125) = 0.75 + 3 - 1 = 2.75$$

**Verification:** The curve passes through $(1,2)$, $(2,4)$, $(3,8)$ exactly, and at the midpoint $x=1.5$ gives $P(1.5) = 2.75$, which lies between the second and third points as expected.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Lagrange interpolation at x = 1.5","steps":[{"prompt":"Step 1: Set up the Lagrange basis polynomial $L_1(x)$ for point 1. What is the denominator $(x_1 - x_2)(x_1 - x_3)$?","hint":"$x_1 = 1, x_2 = 2, x_3 = 3$. Multiply $(1-2) \\times (1-3)$.","answer":"$(1-2)(1-3) = (-1)(-2) = 2$"},{"prompt":"Step 2: Evaluate $L_1(1.5)$ using the basis polynomial $L_1(x) = \\frac{(x-2)(x-3)}{2}$.","hint":"Substitute $x = 1.5$: $L_1(1.5) = \\frac{(1.5-2)(1.5-3)}{2} = \\frac{(-0.5)(-1.5)}{2}$.","answer":"$L_1(1.5) = 0.375$"},{"prompt":"Step 3: Evaluate $L_2(1.5)$ and $L_3(1.5)$, then compute $P(1.5) = 2 \\cdot L_1 + 4 \\cdot L_2 + 8 \\cdot L_3$.","hint":"$L_2(1.5) = 0.75$ and $L_3(1.5) = -0.125$. Compute $2(0.375) + 4(0.75) + 8(-0.125)$.","answer":"$P(1.5) = 0.75 + 3 - 1 = 2.75$"}],"caption":"Lagrange interpolation builds the polynomial systematically from basis functions, each designed to isolate one data point."}
```

DONE:interpolation
