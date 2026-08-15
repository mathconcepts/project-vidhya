---
id: mean-value-theorems.worked-example
concept_id: mean-value-theorems
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Locating the Mean Value Point

## Problem

Let $f(x) = x^3 - 3x^2 + 2$ on the interval $[0, 3]$. By the Mean Value Theorem, find the value(s) of $c \in (0, 3)$ such that 
$$f'(c) = \frac{f(3) - f(0)}{3 - 0}$$

## Solution

**Step 1: Verify MVT conditions**
- $f(x) = x^3 - 3x^2 + 2$ is a polynomial, hence continuous on $[0, 3]$ and differentiable on $(0, 3)$. ✓ MVT applies.

**Step 2: Calculate the average rate of change**
$$f(0) = 0 - 0 + 2 = 2$$
$$f(3) = 27 - 27 + 2 = 2$$
$$\text{Average slope} = \frac{f(3) - f(0)}{3 - 0} = \frac{2 - 2}{3} = 0$$

**Step 3: Find $f'(x)$**
$$f'(x) = 3x^2 - 6x$$

**Step 4: Solve $f'(c) = 0$**
$$3c^2 - 6c = 0$$
$$3c(c - 2) = 0$$
$$c = 0 \text{ or } c = 2$$

Since $c$ must be in the open interval $(0, 3)$, we have $c = 2$.

**Step 5: Verify**
- $f'(2) = 3(4) - 6(2) = 12 - 12 = 0$ ✓
- This matches the average slope of $0$.

**Answer:** $c = 2$

**Exam insight:** This problem combines Rolle's theorem (a special case of MVT where $f(a) = f(b)$, forcing the average slope to zero) with practical root-finding. When the endpoints have equal function values, the derivative *must* vanish somewhere in between—a powerful structural guarantee used in optimization and existence proofs.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding the mean value point","steps":[{"prompt":"Step 1: Check the three MVT conditions (continuity, differentiability, closed interval).","hint":"Polynomials are continuous and differentiable everywhere. The interval [0, 3] is closed and bounded.","answer":"f(x) is continuous on [0, 3] and differentiable on (0, 3)."},{"prompt":"Step 2: Compute f(0) and f(3), then the average slope.","hint":"Substitute x = 0 and x = 3 into f(x) = x³ - 3x² + 2. Then divide: [f(3) - f(0)] / (3 - 0).","answer":"f(0) = 2, f(3) = 2, average slope = (2 - 2)/3 = 0."},{"prompt":"Step 3: Take the derivative f'(x).","hint":"Power rule: d/dx(x³) = 3x², d/dx(x²) = 2x.","answer":"f'(x) = 3x² - 6x."},{"prompt":"Step 4: Solve f'(c) = 0, then check which solution(s) lie in (0, 3).","hint":"Set 3c² - 6c = 0. Factor out 3c. Solutions are c = 0 and c = 2. Which is in the open interval?","answer":"c = 2 (since c = 0 is not in the open interval (0, 3))."},{"prompt":"Step 5: Why does this problem work so cleanly?","hint":"Notice f(0) = f(3). This is the special case called Rolle's Theorem. When function values match at the endpoints, the derivative must hit zero somewhere inside.","answer":"Rolle's Theorem: If f(a) = f(b), then ∃c ∈ (a, b) with f'(c) = 0. This is MVT with average slope = 0."}],"caption":"Key exam insight: Recognize when the average slope is zero—it signals Rolle's Theorem and guarantees an interior critical point."}
```
```

---

Use the following commands in your terminal to create these files:

```bash
mkdir -p /home/user/project-vidhya/modules/project-vidhya-content/concepts/mean-value-theorems/atoms

cat > /home/user/project-vidhya/modules/project-vidhya-content/concepts/mean-value-theorems/atoms/intuition.md << 'EOF'
[paste File 1 content above]
EOF

cat > /home/user/project-vidhya/modules/project-vidhya-content/concepts/mean-value-theorems/atoms/visual-analogy.md << 'EOF'
[paste File 2 content above]
EOF

cat > /home/user/project-vidhya/modules/project-vidhya-content/concepts/mean-value-theorems/atoms/worked-example.md << 'EOF'
[paste File 3 content above]
EOF

DONE:mean-value-theorems
