---
id: implicit-differentiation.formal-definition
concept_id: implicit-differentiation
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Implicit Differentiation**: Given F(x,y)=0, differentiate both sides with respect to x, applying the chain rule to every y-term: d/dx[f(y)] = f'(y)·dy/dx.

**Method selector.** Differentiate implicitly whenever $y$ cannot be cleanly isolated, or isolating it forces a choice of branch (e.g. $y=\pm\sqrt{r^2-x^2}$ for a circle). A tempting shortcut — solve for $y$ explicitly first, then differentiate — only works when the equation is solvable in closed form, and it silently commits the answer to one branch while implicit differentiation covers both at once.
