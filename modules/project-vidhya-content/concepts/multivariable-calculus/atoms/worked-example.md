---
id: multivariable-calculus.worked-example
concept_id: multivariable-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Problem: Compute the Jacobian and Verify Partial Derivatives

**Given:** 
$$f(x, y) = x^2 y + 3xy^2 - 2x + y$$

**Find:** 
1. $\frac{\partial f}{\partial x}$ and $\frac{\partial f}{\partial y}$
2. The Jacobian matrix (for a vector function, show the structure)
3. Evaluate both partial derivatives at point $(1, 2)$

---

## Solution

### Step 1: Compute $\frac{\partial f}{\partial x}$ (treat $y$ as a constant)

$$\frac{\partial f}{\partial x} = \frac{\partial}{\partial x}(x^2 y + 3xy^2 - 2x + y)$$

Differentiating term by term:
- $\frac{\partial}{\partial x}(x^2 y) = 2xy$ (power rule, $y$ is constant)
- $\frac{\partial}{\partial x}(3xy^2) = 3y^2$
- $\frac{\partial}{\partial x}(-2x) = -2$
- $\frac{\partial}{\partial x}(y) = 0$ (no $x$ in this term)

$$\boxed{\frac{\partial f}{\partial x} = 2xy + 3y^2 - 2}$$

### Step 2: Compute $\frac{\partial f}{\partial y}$ (treat $x$ as a constant)

$$\frac{\partial f}{\partial y} = \frac{\partial}{\partial y}(x^2 y + 3xy^2 - 2x + y)$$

Differentiating term by term:
- $\frac{\partial}{\partial y}(x^2 y) = x^2$
- $\frac{\partial}{\partial y}(3xy^2) = 6xy$ (power rule, $x$ is constant)
- $\frac{\partial}{\partial y}(-2x) = 0$
- $\frac{\partial}{\partial y}(y) = 1$

$$\boxed{\frac{\partial f}{\partial y} = x^2 + 6xy + 1}$$

### Step 3: Jacobian Matrix

For a scalar function $f(x, y)$, the Jacobian is the **gradient vector**:

$$J = \nabla f = \left[\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}\right] = [2xy + 3y^2 - 2, \quad x^2 + 6xy + 1]$$

(For vector-valued functions like $\mathbf{F}: \mathbb{R}^2 \to \mathbb{R}^2$, the Jacobian is a 2×2 matrix.)

### Step 4: Evaluate at $(1, 2)$

$$\frac{\partial f}{\partial x}\bigg|_{(1,2)} = 2(1)(2) + 3(2)^2 - 2 = 4 + 12 - 2 = 14$$

$$\frac{\partial f}{\partial y}\bigg|_{(1,2)} = (1)^2 + 6(1)(2) + 1 = 1 + 12 + 1 = 14$$

So the gradient at $(1, 2)$ is $\nabla f(1, 2) = [14, 14]$.

**Key exam insight:** At point $(1, 2)$, the function increases equally fast in both the $x$ and $y$ directions (both partial derivatives equal 14). The gradient vector points in direction $\frac{1}{\sqrt{2}}(1, 1)$ with magnitude $\sqrt{14^2 + 14^2} = 14\sqrt{2}$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Compute partial derivatives and Jacobian","steps":[{"prompt":"Step 1: To find $\\frac{\\partial f}{\\partial x}$ of $f(x,y) = x^2y + 3xy^2 - 2x + y$, what do you treat as a constant?","hint":"Partial derivatives with respect to $x$ mean we treat the other variable as a constant. Differentiate each term with $x$ as the variable.","answer":"Treat $y$ as a constant. Then: $\\frac{\\partial f}{\\partial x} = 2xy + 3y^2 - 2$"},{"prompt":"Step 2: Now find $\\frac{\\partial f}{\\partial y}$ by treating $x$ as a constant. Differentiate each term with respect to $y$.","hint":"Apply power rule to each term, remembering $x$ is constant now. The $-2x$ term has no $y$, so it vanishes.","answer":"$\\frac{\\partial f}{\\partial y} = x^2 + 6xy + 1$"},{"prompt":"Step 3: Evaluate both partial derivatives at the point $(1, 2)$.","hint":"Substitute $x = 1$ and $y = 2$ into both expressions. $\\frac{\\partial f}{\\partial x}|_{(1,2)} = 2(1)(2) + 3(4) - 2$","answer":"At $(1,2)$: $\\frac{\\partial f}{\\partial x} = 14$ and $\\frac{\\partial f}{\\partial y} = 14$. The gradient is $\\nabla f = [14, 14]$."}],"caption":"The Jacobian for a scalar function is the gradient vector. Partial derivatives are its components."}
```
