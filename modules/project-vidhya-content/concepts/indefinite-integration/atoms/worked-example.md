---
id: indefinite-integration.worked_example
concept_id: indefinite-integration
atom_type: worked_example
scaffold_fade: true
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
---

## Problem

Evaluate $\displaystyle\int \frac{3x+5}{(x-1)(x+2)}\,dx$.

---

**Step 1: Rule out substitution first.**

The denominator's derivative is $\dfrac{d}{dx}[(x-1)(x+2)] = \dfrac{d}{dx}[x^2+x-2] = 2x+1$. The numerator, $3x+5$, is not a constant multiple of $2x+1$ (their ratio is not constant), so no substitution collapses this in one step. It is a genuine proper rational function with distinct linear factors — partial fractions is the right call.

**Step 2: Set up the decomposition.**

$$\frac{3x+5}{(x-1)(x+2)} = \frac{A}{x-1} + \frac{B}{x+2}$$

Multiply both sides by $(x-1)(x+2)$:

$$3x+5 = A(x+2) + B(x-1)$$

**Step 3: Solve for $A$ and $B$ by choosing convenient $x$-values.**

At $x=1$ (this kills the $B$ term): $3(1)+5 = A(3) \Rightarrow 8 = 3A \Rightarrow A = \dfrac{8}{3}$.

At $x=-2$ (this kills the $A$ term): $3(-2)+5 = B(-3) \Rightarrow -1 = -3B \Rightarrow B = \dfrac{1}{3}$.

**Step 4: Integrate each simple term.**

$$\int \frac{8/3}{x-1}\,dx + \int \frac{1/3}{x+2}\,dx = \frac{8}{3}\ln|x-1| + \frac{1}{3}\ln|x+2| + C$$

$$\boxed{\int \frac{3x+5}{(x-1)(x+2)}\,dx = \frac{8}{3}\ln|x-1| + \frac{1}{3}\ln|x+2| + C}$$

**Step 5: Check by differentiating the answer.**

$$\frac{d}{dx}\left[\frac{8}{3}\ln|x-1| + \frac{1}{3}\ln|x+2|\right] = \frac{8/3}{x-1} + \frac{1/3}{x+2} = \frac{3x+5}{(x-1)(x+2)}$$

(common denominator: $\frac{8(x+2)+ (x-1)}{3(x-1)(x+2)} = \frac{9x+15}{3(x-1)(x+2)} = \frac{3x+5}{(x-1)(x+2)}$ — matches the original integrand.)

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: partial fractions on (3x+5)/((x-1)(x+2))","why":"Checking the numerator against the denominator's derivative first is what tells you substitution is NOT available here, before you commit to the decomposition.","steps":[{"prompt":"Is the numerator 3x+5 a constant multiple of the denominator's derivative, 2x+1?","hint":"Divide: (3x+5)/(2x+1) is not a constant.","answer":"No — so substitution does not apply; set up partial fractions instead."},{"prompt":"Write the decomposition A/(x-1) + B/(x+2), clear denominators, and find A by setting x=1.","hint":"At x=1, the B-term vanishes: 3(1)+5 = A(1+2).","answer":"A = 8/3"},{"prompt":"Find B by setting x=-2.","hint":"At x=-2, the A-term vanishes: 3(-2)+5 = B(-2-1).","answer":"B = 1/3"},{"prompt":"Integrate both simple fractions.","hint":"Each is of the form k/(x-a), integrating to k·ln|x-a|.","answer":"(8/3)ln|x-1| + (1/3)ln|x+2| + C"}],"caption":"Check the derivative-of-denominator test BEFORE setting up partial fractions — it is the fastest way to know which technique actually applies."}
```
