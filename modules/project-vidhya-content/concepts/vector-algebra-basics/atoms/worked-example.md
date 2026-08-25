---
id: vector-algebra-basics.worked-example
concept_id: vector-algebra-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Angle, Area, and Volume from Three Vectors

## Problem (GATE-style)

Let $\vec{a} = \hat{i} + \hat{j}$, $\vec{b} = \hat{i} + \hat{k}$, and $\vec{c} = \hat{i} + \hat{j} + \hat{k}$.

**(a)** Find the angle between $\vec{a}$ and $\vec{b}$.
**(b)** Find $\vec{a} \times \vec{b}$ and the area of the parallelogram they span.
**(c)** Find the scalar triple product $[\vec{a}\ \vec{b}\ \vec{c}]$ and determine whether $\vec{a}, \vec{b}, \vec{c}$ are coplanar.

---

## Solution

### Part (a): Angle Between $\vec{a}$ and $\vec{b}$

$\vec{a} = (1, 1, 0)$, $\vec{b} = (1, 0, 1)$.

$$\vec{a}\cdot\vec{b} = (1)(1) + (1)(0) + (0)(1) = 1$$
$$|\vec{a}| = \sqrt{1^2+1^2+0^2} = \sqrt{2}, \qquad |\vec{b}| = \sqrt{1^2+0^2+1^2} = \sqrt{2}$$
$$\cos\theta = \frac{\vec{a}\cdot\vec{b}}{|\vec{a}||\vec{b}|} = \frac{1}{\sqrt{2}\cdot\sqrt{2}} = \frac{1}{2}$$
$$\theta = \boxed{60^\circ}$$

### Part (b): Cross Product and Area

$$\vec{a}\times\vec{b} = \begin{vmatrix} \hat{i} & \hat{j} & \hat{k} \\ 1 & 1 & 0 \\ 1 & 0 & 1 \end{vmatrix} = \hat{i}(1\cdot1 - 0\cdot0) - \hat{j}(1\cdot1 - 0\cdot1) + \hat{k}(1\cdot0 - 1\cdot1)$$
$$\vec{a}\times\vec{b} = \hat{i}(1) - \hat{j}(1) + \hat{k}(-1) = \boxed{(1, -1, -1)}$$

Area of the parallelogram:
$$|\vec{a}\times\vec{b}| = \sqrt{1^2 + (-1)^2 + (-1)^2} = \sqrt{3}$$

**Cross-check** using $|\vec{a}||\vec{b}|\sin\theta$: with $\theta = 60^\circ$, $\sin 60^\circ = \frac{\sqrt3}{2}$, so $|\vec{a}||\vec{b}|\sin\theta = \sqrt2\cdot\sqrt2\cdot\frac{\sqrt3}{2} = 2\cdot\frac{\sqrt3}{2} = \sqrt3$. Matches — the area is $\boxed{\sqrt{3}}$ square units.

### Part (c): Scalar Triple Product and Coplanarity

We need $\vec{b}\times\vec{c}$ first, with $\vec{b}=(1,0,1)$, $\vec{c}=(1,1,1)$:

$$\vec{b}\times\vec{c} = \begin{vmatrix} \hat{i} & \hat{j} & \hat{k} \\ 1 & 0 & 1 \\ 1 & 1 & 1 \end{vmatrix} = \hat{i}(0\cdot1 - 1\cdot1) - \hat{j}(1\cdot1 - 1\cdot1) + \hat{k}(1\cdot1 - 0\cdot1) = (-1, 0, 1)$$

$$\vec{a}\cdot(\vec{b}\times\vec{c}) = (1)(-1) + (1)(0) + (0)(1) = -1$$

**Cross-check** via the determinant directly:
$$[\vec{a}\ \vec{b}\ \vec{c}] = \begin{vmatrix} 1 & 1 & 0 \\ 1 & 0 & 1 \\ 1 & 1 & 1 \end{vmatrix} = 1(0\cdot1 - 1\cdot1) - 1(1\cdot1 - 1\cdot1) + 0(1\cdot1 - 0\cdot1) = 1(-1) - 1(0) + 0 = -1$$

Both methods agree: $[\vec{a}\ \vec{b}\ \vec{c}] = \boxed{-1}$.

Since the scalar triple product is **nonzero**, the volume of the parallelepiped is $|-1| = 1$ cubic unit, and $\vec{a}, \vec{b}, \vec{c}$ are **not coplanar**.

---

## Key Insights

- **Angle from the dot product, shape from the cross product**: the dot product answers "how aligned," the cross product answers "how much area/twist."
- **Sign vs. magnitude in the triple product**: the *sign* tells you the handedness of the triple (positive = right-handed ordering); only the *value being zero* — not its sign — signals coplanarity.
- **Always cross-check**: computing $|\vec{a}\times\vec{b}|$ two independent ways (determinant, then $|\vec{a}||\vec{b}|\sin\theta$) catches sign and arithmetic slips before they cost marks.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: scalar triple product and coplanarity","steps":[{"prompt":"To test whether $\\vec{a}=(1,1,0)$, $\\vec{b}=(1,0,1)$, $\\vec{c}=(1,1,1)$ are coplanar, which single number do we need to compute?","hint":"It's the volume of the parallelepiped they form.","answer":"The scalar triple product $[\\vec{a}\\ \\vec{b}\\ \\vec{c}] = \\vec{a}\\cdot(\\vec{b}\\times\\vec{c})$."},{"prompt":"Compute $\\vec{b}\\times\\vec{c}$ first. What vector do you get?","hint":"Use the determinant formula with rows $\\hat i,\\hat j,\\hat k$ then $\\vec b$ then $\\vec c$.","answer":"$\\vec{b}\\times\\vec{c} = (-1, 0, 1)$"},{"prompt":"Now dot $\\vec{a}=(1,1,0)$ with $(-1,0,1)$. What is the scalar triple product, and are the vectors coplanar?","hint":"$\\vec a \\cdot (\\vec b \\times \\vec c) = (1)(-1)+(1)(0)+(0)(1)$.","answer":"The triple product is $-1$, which is nonzero, so the three vectors are NOT coplanar."}],"caption":"A zero scalar triple product means zero enclosed volume — the geometric signature of three vectors collapsing into a single plane."}
```
