---
# Alternative body for mean-value-theorems.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: mean-value-theorems.worked_example.assured
concept_id: mean-value-theorems
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: mean-value-theorems.worked-example
for_stance: assured
---

$f(0)=2=f(3)$ signals Rolle's theorem on sight: the average slope is automatically $0$, so the problem reduces to solving $f'(c)=0$ directly — no need to compute the slope formula as a separate step.

$f'(x)=3x^2-6x=3x(x-2)=0$ gives $c=0$ or $c=2$.

**Answer:** $\boxed{c=2}$, since $c=0$ sits at the excluded left endpoint, outside the open interval $(0,3)$ MVT actually promises the point in.

The mark-loser on Rolle's-theorem-in-disguise problems: reporting *every* root of $f'(c)=0$ without filtering for the open interval, or worse, reporting the endpoint root as if it counted — MVT's guarantee is specifically about the *interior*, and a root sitting exactly at $a$ or $b$ is not evidence the theorem applies there; it happens to coincide with an endpoint, which is a different and unremarkable fact.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding the mean value point","steps":[{"prompt":"Step 1: Check the three MVT conditions (continuity, differentiability, closed interval).","hint":"Polynomials are continuous and differentiable everywhere. The interval [0, 3] is closed and bounded.","answer":"f(x) is continuous on [0, 3] and differentiable on (0, 3)."},{"prompt":"Step 2: Compute f(0) and f(3), then the average slope.","hint":"Substitute x = 0 and x = 3 into f(x) = x³ - 3x² + 2. Then divide: [f(3) - f(0)] / (3 - 0).","answer":"f(0) = 2, f(3) = 2, average slope = (2 - 2)/3 = 0."},{"prompt":"Step 3: Take the derivative f'(x).","hint":"Power rule: d/dx(x³) = 3x², d/dx(x²) = 2x.","answer":"f'(x) = 3x² - 6x."},{"prompt":"Step 4: Solve f'(c) = 0, then check which solution(s) lie in (0, 3).","hint":"Set 3c² - 6c = 0. Factor out 3c. Solutions are c = 0 and c = 2. Which is in the open interval?","answer":"c = 2 (since c = 0 is not in the open interval (0, 3))."},{"prompt":"Step 5: Why does this problem work so cleanly?","hint":"Notice f(0) = f(3). This is the special case called Rolle's Theorem. When function values match at the endpoints, the derivative must hit zero somewhere inside.","answer":"Rolle's Theorem: If f(a) = f(b), then ∃c ∈ (a, b) with f'(c) = 0. This is MVT with average slope = 0."}],"caption":"Key exam insight: Recognize when the average slope is zero—it signals Rolle's Theorem and guarantees an interior critical point."}
```
