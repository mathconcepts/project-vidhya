---
id: differentiability.worked_example
concept_id: differentiability
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Finding Differentiability Conditions

## Problem

Find the values of $a$ and $b$ such that the following piecewise function is differentiable at $x = 1$:

$$f(x) = \begin{cases} x^2 & x \leq 1 \\ ax + b & x > 1 \end{cases}$$

## Solution

For a piecewise function to be differentiable at the junction point $x = 1$, it must satisfy two conditions:
1. **Continuity:** The left and right limits must equal the function value
2. **Differentiability:** The left and right derivatives must be equal

### Step 1: Apply Continuity Condition

The function value at $x = 1$ from the first piece:
$$f(1) = 1^2 = 1$$

The limit as we approach from the right:
$$\lim_{x \to 1^+} f(x) = \lim_{x \to 1^+} (ax + b) = a + b$$

For continuity: $a + b = 1$ ... **(Equation 1)**

### Step 2: Find the Left Derivative

For $x \leq 1$: $f(x) = x^2$, so
$$f'(x) = 2x$$
$$f'(1^-) = 2(1) = 2$$

### Step 3: Find the Right Derivative

For $x > 1$: $f(x) = ax + b$, so
$$f'(x) = a$$
$$f'(1^+) = a$$

### Step 4: Apply Differentiability Condition

For differentiability, the derivatives must match:
$$f'(1^-) = f'(1^+)$$
$$2 = a$$ ... **(Equation 2)**

### Step 5: Solve for Both Parameters

From Equation 2: $a = 2$

Substitute into Equation 1:
$$2 + b = 1$$
$$b = -1$$

## Answer

$$\boxed{a = 2, \quad b = -1}$$

The function becomes $f(x) = \begin{cases} x^2 & x \leq 1 \\ 2x - 1 & x > 1 \end{cases}$, which is continuous and differentiable at $x = 1$ with derivative value $f'(1) = 2$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Piecewise Differentiability","steps":[{"prompt":"Step 1: For differentiability at x = 1, the function must first be continuous. What must be true about the left and right limits?","hint":"The limits from both sides must equal f(1) = 1². Find the right limit: a(1) + b = ?","answer":"Both limits must equal 1, so a + b = 1"},{"prompt":"Step 2: Calculate the left derivative at x = 1 by differentiating x² and evaluating at x = 1.","hint":"d/dx(x²) = 2x. At x = 1, this equals ?","answer":"f'(1⁻) = 2(1) = 2"},{"prompt":"Step 3: The right derivative is the derivative of ax + b. What is this?","hint":"The derivative of a linear function ax + b is just the slope.","answer":"f'(1⁺) = a"},{"prompt":"Step 4: For differentiability, left and right derivatives must be equal: 2 = a. Use continuity a + b = 1 to find b.","hint":"If a = 2, then 2 + b = 1, so b = ?","answer":"a = 2 and b = −1"}],"caption":"Key exam insight: Check continuity first (matching y-values), then matching slopes (derivatives) at the junction point."}
```

---

DONE:differentiability
