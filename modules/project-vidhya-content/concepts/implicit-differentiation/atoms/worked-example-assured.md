---
# Alternative body for implicit-differentiation.worked_example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: implicit-differentiation.worked_example.assured
concept_id: implicit-differentiation
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: implicit-differentiation-worked-example
for_stance: assured
---

Differentiate directly, term by term, applying whichever rule each term calls for without pausing to label it: $x^2\to2x$; $xy\to y+x\,y'$ (product rule, mixed term); $y^2\to2y\,y'$ (chain rule, pure $y$); the constant right side $\to0$.

**Answer:** $2x+y+xy'+2yy'=0\ \Rightarrow\ y'=-\dfrac{2x+y}{x+2y}$; at $(2,1)$, $y'=-\dfrac54$.

The same pattern on $x^3+y^3=6xy$ (Folium of Descartes) gives $y'=\dfrac{2y-x^2}{y^2-2x}$ — but check the denominator before trusting it: at the origin, $y^2-2x=0$ *and* the numerator $2y-x^2=0$ too, so the formula is $\frac00$ there, not a slope of $0$ or $\infty$. The curve genuinely self-intersects at the origin, and no single tangent exists to report.

The reliable mark-loser on this pattern: writing $\frac{d}{dx}[y^3]=3y^2$, dropping the $\cdot y'$ that turns a bare number into the correct expression — every pure power of $y$ needs that factor, with no exceptions.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: implicit differentiation of x² + xy + y² = 7","steps":[{"prompt":"For x² + xy + y² = 7, what does d/dx[y²] equal? Remember that y depends on x.","hint":"Apply the chain rule: d/dx[y²] = d/dy[y²] × dy/dx.","answer":"2y · (dy/dx)"},{"prompt":"What does d/dx[xy] equal? This is a product of x and y(x).","hint":"Use the product rule with u=x and v=y. The derivative of x is 1, the derivative of y is dy/dx.","answer":"y + x·(dy/dx)"},{"prompt":"After differentiating all three terms and setting equal to 0, what equation do you get?","hint":"Differentiate term by term: d/dx[x²]=2x, d/dx[xy]=y+x·y', d/dx[y²]=2y·y', and right side=0.","answer":"2x + y + x·(dy/dx) + 2y·(dy/dx) = 0"},{"prompt":"Collect the dy/dx terms and solve. What is the final answer?","hint":"Group x·(dy/dx) + 2y·(dy/dx) on the left, move 2x+y to the right, then factor and divide.","answer":"dy/dx = -(2x + y) / (x + 2y)"}]}
```
