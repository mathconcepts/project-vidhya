---
# Alternative body for differentiability.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: differentiability.worked_example.shaken
concept_id: differentiability
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: differentiability.worked_example
for_stance: shaken
---

**Given:** $f(x)=x^2$ for $x\le1$, $f(x)=ax+b$ for $x>1$. Find $a,b$ so $f$ is differentiable at $x=1$.

**Step 1.** Find $f(1)$ from the first piece: $f(1)=1^2=1$.

**Step 2.** Find the limit from the right: $\lim_{x\to1^+}(ax+b)=a+b$.

**Step 3.** Set them equal for continuity: $a+b=1$.

**Step 4.** Find the left-hand derivative: $f'(x)=2x$ for $x\le1$, so $f'(1^-)=2(1)=2$.

**Step 5.** Find the right-hand derivative: $f'(x)=a$ for $x>1$, so $f'(1^+)=a$.

**Step 6.** Set them equal for differentiability: $a=2$.

**Step 7.** Substitute $a=2$ into $a+b=1$: $b=-1$.

**Answer:** $a=2,\ b=-1$.

**Check it:** with $a=2,b=-1$, the right piece is $2x-1$; at $x=1$ that gives $2(1)-1=1$, matching $f(1)=1$ from the left piece exactly.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Piecewise Differentiability","steps":[{"prompt":"Step 1: For differentiability at x = 1, the function must first be continuous. What must be true about the left and right limits?","hint":"The limits from both sides must equal f(1) = 1². Find the right limit: a(1) + b = ?","answer":"Both limits must equal 1, so a + b = 1"},{"prompt":"Step 2: Calculate the left derivative at x = 1 by differentiating x² and evaluating at x = 1.","hint":"d/dx(x²) = 2x. At x = 1, this equals ?","answer":"f'(1⁻) = 2(1) = 2"},{"prompt":"Step 3: The right derivative is the derivative of ax + b. What is this?","hint":"The derivative of a linear function ax + b is just the slope.","answer":"f'(1⁺) = a"},{"prompt":"Step 4: For differentiability, left and right derivatives must be equal: 2 = a. Use continuity a + b = 1 to find b.","hint":"If a = 2, then 2 + b = 1, so b = ?","answer":"a = 2 and b = −1"}],"caption":"Key exam insight: Check continuity first (matching y-values), then matching slopes (derivatives) at the junction point."}
```
