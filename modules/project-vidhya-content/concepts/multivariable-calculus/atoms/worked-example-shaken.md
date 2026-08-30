---
# Alternative body for multivariable-calculus.worked_example, served when
# the learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: multivariable-calculus.worked_example.shaken
concept_id: multivariable-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: multivariable-calculus.worked-example
for_stance: shaken
---

**Given:** $f(x,y)=x^2y+3xy^2-2x+y$. Find both partial derivatives and evaluate at $(1,2)$.

**Step 1.** Differentiate with respect to $x$ only, treating $y$ as fixed: $\frac{\partial}{\partial x}(x^2y)=2xy$.

**Step 2.** Continue term by term: $\frac{\partial}{\partial x}(3xy^2)=3y^2$; $\frac{\partial}{\partial x}(-2x)=-2$; $\frac{\partial}{\partial x}(y)=0$.

**Step 3.** Add them: $\frac{\partial f}{\partial x}=2xy+3y^2-2$.

**Step 4.** Differentiate with respect to $y$ only, treating $x$ as fixed: $\frac{\partial}{\partial y}(x^2y)=x^2$.

**Step 5.** Continue term by term: $\frac{\partial}{\partial y}(3xy^2)=6xy$; $\frac{\partial}{\partial y}(-2x)=0$; $\frac{\partial}{\partial y}(y)=1$.

**Step 6.** Add them: $\frac{\partial f}{\partial y}=x^2+6xy+1$.

**Step 7.** Evaluate $\frac{\partial f}{\partial x}$ at $(1,2)$: $2(1)(2)+3(4)-2=14$.

**Step 8.** Evaluate $\frac{\partial f}{\partial y}$ at $(1,2)$: $1+12+1=14$.

**Answer:** $\nabla f(1,2)=[14,14]$.

**Check it:** both partials came out equal, $14$ and $14$ — landing on the same number from two independently-differentiated expressions is a good sign nothing was dropped along the way.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Compute partial derivatives and Jacobian","steps":[{"prompt":"Step 1: To find $\\frac{\\partial f}{\\partial x}$ of $f(x,y) = x^2y + 3xy^2 - 2x + y$, what do you treat as a constant?","hint":"Partial derivatives with respect to $x$ mean we treat the other variable as a constant. Differentiate each term with $x$ as the variable.","answer":"Treat $y$ as a constant. Then: $\\frac{\\partial f}{\\partial x} = 2xy + 3y^2 - 2$"},{"prompt":"Step 2: Now find $\\frac{\\partial f}{\\partial y}$ by treating $x$ as a constant. Differentiate each term with respect to $y$.","hint":"Apply power rule to each term, remembering $x$ is constant now. The $-2x$ term has no $y$, so it vanishes.","answer":"$\\frac{\\partial f}{\\partial y} = x^2 + 6xy + 1$"},{"prompt":"Step 3: Evaluate both partial derivatives at the point $(1, 2)$.","hint":"Substitute $x = 1$ and $y = 2$ into both expressions. $\\frac{\\partial f}{\\partial x}|_{(1,2)} = 2(1)(2) + 3(4) - 2$","answer":"At $(1,2)$: $\\frac{\\partial f}{\\partial x} = 14$ and $\\frac{\\partial f}{\\partial y} = 14$. The gradient is $\\nabla f = [14, 14]$."}],"caption":"The Jacobian for a scalar function is the gradient vector. Partial derivatives are its components."}
```
