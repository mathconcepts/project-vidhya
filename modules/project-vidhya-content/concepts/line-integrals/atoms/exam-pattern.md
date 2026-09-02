---
id: line-integrals.exam_pattern
concept_id: line-integrals
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions evaluate a specific line integral to a decimal or a clean fraction**, usually after a parametrization is either handed to you or forced by the curve's shape (a segment, a circle, a piece of a parabola).

  Example: $\mathbf F=(y,x)$ from $(0,0)$ to $(1,1)$. The mixed-partials check gives $\partial Q/\partial x = \partial P/\partial y = 1$, so $\mathbf F$ is conservative with potential $\phi=xy$, and the integral is $\phi(1,1)-\phi(0,0)=1$ regardless of which curve joins the two points.

- **MCQ options test whether conservativeness was checked before computing.** A typical distractor set includes the correctly-computed value alongside the value from a *different* path than the one stated (plausible only if the solver never ran the mixed-partials test) and a value with the wrong sign from traversing the curve backward.

- **MSQ statements probe path-(in)dependence directly** — "the integral's value depends only on the endpoints," "reversing the curve's direction flips the sign," "a closed curve always gives zero" (true only when the field is conservative) — mixing true structural facts with one that quietly needs the conservative hypothesis.

- **Time budget:** a conservative-field NAT, once the mixed-partials check passes, should take under a minute — evaluate the potential at two points and subtract. A non-conservative curve genuinely needing the full parametrize-differentiate-dot-integrate sequence deserves two to three minutes, most of it spent getting $\mathbf r'(t)$ right.
