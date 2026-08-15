---
id: greens-theorem.worked-example
concept_id: greens-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Green's Theorem in Circulation Form

## Problem

Use Green's Theorem to evaluate the line integral:
$$\oint_C (2xy + x^2) \, dx + (x^2 + y^2) \, dy$$
where $C$ is the closed curve forming the boundary of the region $D$ enclosed by $y = x^2$ (from below) and $y = 2x$ (from above), traversed counterclockwise.

## Solution

**Step 1: Identify the vector field**

We have $P(x,y) = 2xy + x^2$ and $Q(x,y) = x^2 + y^2$.

**Step 2: Apply Green's Theorem (Circulation Form)**

$$\oint_C P \, dx + Q \, dy = \iint_D \left(\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}\right) dA$$

**Step 3: Compute partial derivatives**

$$\frac{\partial Q}{\partial x} = 2x$$
$$\frac{\partial P}{\partial y} = 2x$$

Therefore:
$$\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y} = 2x - 2x = 0$$

**Step 4: Evaluate the double integral**

$$\iint_D 0 \, dA = 0$$

## Answer

$$\oint_C (2xy + x^2) \, dx + (x^2 + y^2) \, dy = \boxed{0}$$

**Key insight:** The curl of this vector field is zero everywhere—it's a conservative field—so circulation around any closed curve is zero.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Green's Theorem circulation integral","steps":[{"prompt":"Step 1: What are P and Q from the line integral form?","hint":"Look at the coefficients of dx and dy in the original integral.","answer":"P = 2xy + x² and Q = x² + y²"},{"prompt":"Step 2: What is ∂Q/∂x?","hint":"Take the partial derivative of x² + y² with respect to x.","answer":"∂Q/∂x = 2x"},{"prompt":"Step 3: What is ∂P/∂y?","hint":"Take the partial derivative of 2xy + x² with respect to y.","answer":"∂P/∂y = 2x"},{"prompt":"Step 4: What is (∂Q/∂x) - (∂P/∂y) and why does this matter?","hint":"Subtract the result from Step 3 from Step 2. What does this tell you about the field?","answer":"0. The curl is zero everywhere, meaning the field is conservative and circulation is always zero."}],"caption":"Green's Theorem converts boundary circulation to interior curl—when curl is zero, circulation vanishes."}
```

---

DONE:greens-theorem
