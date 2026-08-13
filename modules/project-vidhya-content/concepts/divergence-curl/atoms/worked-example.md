---
id: divergence-curl-worked-example
concept_id: divergence-curl
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example — GATE Style

**Problem:** Given $\mathbf{F} = xy^2\,\hat{i} + yz^2\,\hat{j} + zx^2\,\hat{k}$, compute:

**(a)** $\nabla \cdot \mathbf{F}$ at the point $(1, 2, 3)$.

**(b)** $\nabla \times \mathbf{F}$ at the point $(1, 2, 3)$.

**(c)** Verify that $\nabla \cdot (\nabla \times \mathbf{F}) = 0$.

---

## Step 1 — Identify Components

$$F_x = xy^2, \qquad F_y = yz^2, \qquad F_z = zx^2$$

---

## Step 2 — Compute Divergence

$$\nabla \cdot \mathbf{F} = \frac{\partial F_x}{\partial x} + \frac{\partial F_y}{\partial y} + \frac{\partial F_z}{\partial z}$$

$$\frac{\partial}{\partial x}(xy^2) = y^2, \qquad \frac{\partial}{\partial y}(yz^2) = z^2, \qquad \frac{\partial}{\partial z}(zx^2) = x^2$$

$$\nabla \cdot \mathbf{F} = y^2 + z^2 + x^2$$

At $(1, 2, 3)$:

$$\boxed{\nabla \cdot \mathbf{F}\big|_{(1,2,3)} = 4 + 9 + 1 = 14}$$

---

## Step 3 — Compute Curl

$$\nabla \times \mathbf{F} = \begin{vmatrix} \hat{i} & \hat{j} & \hat{k} \\ \partial_x & \partial_y & \partial_z \\ xy^2 & yz^2 & zx^2 \end{vmatrix}$$

**$\hat{i}$ component:**

$$\frac{\partial(zx^2)}{\partial y} - \frac{\partial(yz^2)}{\partial z} = 0 - 2yz$$

**$\hat{j}$ component** (note the minus sign):

$$-\left[\frac{\partial(zx^2)}{\partial x} - \frac{\partial(xy^2)}{\partial z}\right] = -\left[2xz - 0\right] = -2xz$$

**$\hat{k}$ component:**

$$\frac{\partial(yz^2)}{\partial x} - \frac{\partial(xy^2)}{\partial y} = 0 - 2xy$$

$$\nabla \times \mathbf{F} = (-2yz)\,\hat{i} + (-2xz)\,\hat{j} + (-2xy)\,\hat{k}$$

At $(1, 2, 3)$:

$$\boxed{\nabla \times \mathbf{F}\big|_{(1,2,3)} = -12\,\hat{i} - 6\,\hat{j} - 4\,\hat{k}}$$

---

## Step 4 — Verify $\nabla \cdot (\nabla \times \mathbf{F}) = 0$

Let $\mathbf{G} = \nabla \times \mathbf{F} = (-2yz,\, -2xz,\, -2xy)$.

$$\nabla \cdot \mathbf{G} = \frac{\partial(-2yz)}{\partial x} + \frac{\partial(-2xz)}{\partial y} + \frac{\partial(-2xy)}{\partial z}$$

$$= 0 + 0 + 0 = 0 \checkmark$$

The identity holds as expected — this is always true for any smooth vector field.

---

## GATE Exam Strategy

1. **Divergence is scalar; curl is vector.** Never mix them up in answer format.
2. **The $\hat{j}$ component of curl has a minus sign** in the determinant expansion — the most common calculation error.
3. **Plug in coordinates last.** Compute the general expression first, then substitute.
4. **Identity MCQs:** $\nabla \cdot (\nabla \times \mathbf{F}) = 0$ and $\nabla \times (\nabla f) = \mathbf{0}$ are always true — instant marks.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"For F = (xy², yz², zx²), write down ∂F_x/∂x, ∂F_y/∂y, ∂F_z/∂z and sum them to get div F.","hint":"Differentiate xy² w.r.t. x, yz² w.r.t. y, and zx² w.r.t. z. Each is a straightforward partial.","answer":"y² + z² + x²; at (1,2,3): 4 + 9 + 1 = 14"},{"prompt":"Compute the k̂ component of curl F = ∂F_y/∂x − ∂F_x/∂y for F = (xy², yz², zx²).","hint":"∂(yz²)/∂x = 0, and ∂(xy²)/∂y = 2xy. The k̂ component is the difference.","answer":"0 − 2xy = −2xy. At (1,2,3): −2(1)(2) = −4"},{"prompt":"State the identity that guarantees div(curl F) = 0 for any smooth field, and confirm it for G = (−2yz, −2xz, −2xy).","hint":"Compute ∂(−2yz)/∂x + ∂(−2xz)/∂y + ∂(−2xy)/∂z.","answer":"The identity is ∇·(∇×F) = 0 always. Each partial is 0, confirming 0+0+0 = 0."}]}
```
