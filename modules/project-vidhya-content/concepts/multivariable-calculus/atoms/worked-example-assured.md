---
# Alternative body for multivariable-calculus.worked_example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multivariable-calculus.worked_example.assured
concept_id: multivariable-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: multivariable-calculus.worked-example
for_stance: assured
---

Differentiate term by term for each partial in one pass, without separately naming the constant-treatment step: $\partial_x f=2xy+3y^2-2$; $\partial_y f=x^2+6xy+1$.

**Answer:** at $(1,2)$: $\partial_x f=4+12-2=14$; $\partial_y f=1+12+1=14$; $\nabla f(1,2)=[14,14]$.

The two partials landing on the same number here is a coincidence of this particular point, not a general fact about gradients — do not expect it to recur at $(2,1)$ or any other point without recomputing.

What the gradient actually says: direction $\frac{1}{\sqrt2}(1,1)$ is the direction of steepest increase from $(1,2)$, and $\|\nabla f\|=14\sqrt2$ is the rate of increase *in that direction specifically* — the rate in any other direction is strictly smaller, given by $\nabla f\cdot\hat{\mathbf v}$ for whatever unit vector $\hat{\mathbf v}$ the question asks about.

If $f$ were instead a vector-valued map $\mathbf F(x,y)=(f_1,f_2)$, the Jacobian would be a genuine $2\times2$ matrix, one gradient row per output — this problem's single-row Jacobian is what a *scalar* output collapses to, not the general shape.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Compute partial derivatives and Jacobian","steps":[{"prompt":"Step 1: To find $\\frac{\\partial f}{\\partial x}$ of $f(x,y) = x^2y + 3xy^2 - 2x + y$, what do you treat as a constant?","hint":"Partial derivatives with respect to $x$ mean we treat the other variable as a constant. Differentiate each term with $x$ as the variable.","answer":"Treat $y$ as a constant. Then: $\\frac{\\partial f}{\\partial x} = 2xy + 3y^2 - 2$"},{"prompt":"Step 2: Now find $\\frac{\\partial f}{\\partial y}$ by treating $x$ as a constant. Differentiate each term with respect to $y$.","hint":"Apply power rule to each term, remembering $x$ is constant now. The $-2x$ term has no $y$, so it vanishes.","answer":"$\\frac{\\partial f}{\\partial y} = x^2 + 6xy + 1$"},{"prompt":"Step 3: Evaluate both partial derivatives at the point $(1, 2)$.","hint":"Substitute $x = 1$ and $y = 2$ into both expressions. $\\frac{\\partial f}{\\partial x}|_{(1,2)} = 2(1)(2) + 3(4) - 2$","answer":"At $(1,2)$: $\\frac{\\partial f}{\\partial x} = 14$ and $\\frac{\\partial f}{\\partial y} = 14$. The gradient is $\\nabla f = [14, 14]$."}],"caption":"The Jacobian for a scalar function is the gradient vector. Partial derivatives are its components."}
```
