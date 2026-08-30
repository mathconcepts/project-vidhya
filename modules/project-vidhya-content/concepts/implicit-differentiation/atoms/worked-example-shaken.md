---
# Alternative body for implicit-differentiation.worked_example, served when
# the learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: implicit-differentiation.worked_example.shaken
concept_id: implicit-differentiation
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: implicit-differentiation-worked-example
for_stance: shaken
---

**Given:** $x^2+xy+y^2=7$. Find $\dfrac{dy}{dx}$.

**Step 1.** Differentiate the right side only: $\dfrac{d}{dx}[7]=0$.

**Step 2.** Differentiate $x^2$ alone: $2x$.

**Step 3.** Differentiate $xy$ alone, using the product rule: $y+x\dfrac{dy}{dx}$.

**Step 4.** Differentiate $y^2$ alone, using the chain rule: $2y\dfrac{dy}{dx}$.

**Step 5.** Add the three pieces and set equal to $0$: $2x+y+x\dfrac{dy}{dx}+2y\dfrac{dy}{dx}=0$.

**Step 6.** Move the plain terms to the other side: $x\dfrac{dy}{dx}+2y\dfrac{dy}{dx}=-2x-y$.

**Step 7.** Factor out $\dfrac{dy}{dx}$ and divide: $\dfrac{dy}{dx}=-\dfrac{2x+y}{x+2y}$.

**Answer:** $\dfrac{dy}{dx}=-\dfrac{2x+y}{x+2y}$.

**Check it:** at the point $(2,1)$, which satisfies $4+2+1=7$: $\dfrac{dy}{dx}=-\dfrac{2(2)+1}{2+2(1)}=-\dfrac{5}{4}$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: implicit differentiation of x² + xy + y² = 7","steps":[{"prompt":"For x² + xy + y² = 7, what does d/dx[y²] equal? Remember that y depends on x.","hint":"Apply the chain rule: d/dx[y²] = d/dy[y²] × dy/dx.","answer":"2y · (dy/dx)"},{"prompt":"What does d/dx[xy] equal? This is a product of x and y(x).","hint":"Use the product rule with u=x and v=y. The derivative of x is 1, the derivative of y is dy/dx.","answer":"y + x·(dy/dx)"},{"prompt":"After differentiating all three terms and setting equal to 0, what equation do you get?","hint":"Differentiate term by term: d/dx[x²]=2x, d/dx[xy]=y+x·y', d/dx[y²]=2y·y', and right side=0.","answer":"2x + y + x·(dy/dx) + 2y·(dy/dx) = 0"},{"prompt":"Collect the dy/dx terms and solve. What is the final answer?","hint":"Group x·(dy/dx) + 2y·(dy/dx) on the left, move 2x+y to the right, then factor and divide.","answer":"dy/dx = -(2x + y) / (x + 2y)"}]}
```
