---
# Alternative body for mean-value-theorems.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: mean-value-theorems.worked_example.shaken
concept_id: mean-value-theorems
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: mean-value-theorems.worked-example
for_stance: shaken
---

**Given:** $f(x)=x^3-3x^2+2$ on $[0,3]$. Find $c\in(0,3)$ with $f'(c)=\dfrac{f(3)-f(0)}{3-0}$.

**Step 1.** Check $f$ is a polynomial: continuous and differentiable everywhere, so MVT applies.

**Step 2.** Compute $f(0)=0-0+2=2$.

**Step 3.** Compute $f(3)=27-27+2=2$.

**Step 4.** Average slope: $\dfrac{2-2}{3}=0$.

**Step 5.** Find $f'(x)=3x^2-6x$.

**Step 6.** Set $f'(c)=0$: $3c^2-6c=0$, so $3c(c-2)=0$, giving $c=0$ or $c=2$.

**Step 7.** Keep only the value inside the open interval $(0,3)$: $c=0$ is excluded, so $c=2$.

**Answer:** $c=2$.

**Check it:** $f'(2)=3(4)-6(2)=12-12=0$, matching the average slope of $0$ exactly.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding the mean value point","steps":[{"prompt":"Step 1: Check the three MVT conditions (continuity, differentiability, closed interval).","hint":"Polynomials are continuous and differentiable everywhere. The interval [0, 3] is closed and bounded.","answer":"f(x) is continuous on [0, 3] and differentiable on (0, 3)."},{"prompt":"Step 2: Compute f(0) and f(3), then the average slope.","hint":"Substitute x = 0 and x = 3 into f(x) = x³ - 3x² + 2. Then divide: [f(3) - f(0)] / (3 - 0).","answer":"f(0) = 2, f(3) = 2, average slope = (2 - 2)/3 = 0."},{"prompt":"Step 3: Take the derivative f'(x).","hint":"Power rule: d/dx(x³) = 3x², d/dx(x²) = 2x.","answer":"f'(x) = 3x² - 6x."},{"prompt":"Step 4: Solve f'(c) = 0, then check which solution(s) lie in (0, 3).","hint":"Set 3c² - 6c = 0. Factor out 3c. Solutions are c = 0 and c = 2. Which is in the open interval?","answer":"c = 2 (since c = 0 is not in the open interval (0, 3))."},{"prompt":"Step 5: Why does this problem work so cleanly?","hint":"Notice f(0) = f(3). This is the special case called Rolle's Theorem. When function values match at the endpoints, the derivative must hit zero somewhere inside.","answer":"Rolle's Theorem: If f(a) = f(b), then ∃c ∈ (a, b) with f'(c) = 0. This is MVT with average slope = 0."}],"caption":"Key exam insight: Recognize when the average slope is zero—it signals Rolle's Theorem and guarantees an interior critical point."}
```
