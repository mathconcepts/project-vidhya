---
# Alternative body for differentiability.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: differentiability.worked_example.assured
concept_id: differentiability
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: differentiability.worked_example
for_stance: assured
---

Both conditions are one linear system, not two sequential checks: match value ($a+b=f(1)=1$) and match one-sided derivative ($a=f'(1^-)=2$) simultaneously, then solve. $a=2$ substituted into $a+b=1$ gives $b=-1$ immediately — no need to label continuity and differentiability as separate stages.

**Answer:** $a=2,\ b=-1$.

The mark-loser: matching slopes alone, without also matching values, guarantees nothing. A student who only solves $a=2$ and picks $b$ arbitrarily has a function with the right one-sided derivative on each side but a possible jump in *value* at $x=1$ — and a jump discontinuity is automatically non-differentiable regardless of how the slopes compare, since differentiability requires continuity as a prerequisite, not a side effect. Both equations are load-bearing; neither is optional even when the other looks satisfied.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Piecewise Differentiability","steps":[{"prompt":"Step 1: For differentiability at x = 1, the function must first be continuous. What must be true about the left and right limits?","hint":"The limits from both sides must equal f(1) = 1². Find the right limit: a(1) + b = ?","answer":"Both limits must equal 1, so a + b = 1"},{"prompt":"Step 2: Calculate the left derivative at x = 1 by differentiating x² and evaluating at x = 1.","hint":"d/dx(x²) = 2x. At x = 1, this equals ?","answer":"f'(1⁻) = 2(1) = 2"},{"prompt":"Step 3: The right derivative is the derivative of ax + b. What is this?","hint":"The derivative of a linear function ax + b is just the slope.","answer":"f'(1⁺) = a"},{"prompt":"Step 4: For differentiability, left and right derivatives must be equal: 2 = a. Use continuity a + b = 1 to find b.","hint":"If a = 2, then 2 + b = 1, so b = ?","answer":"a = 2 and b = −1"}],"caption":"Key exam insight: Check continuity first (matching y-values), then matching slopes (derivatives) at the junction point."}
```
