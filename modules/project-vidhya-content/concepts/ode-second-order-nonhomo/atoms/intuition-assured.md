---
# for_stance: assured — the one distinction that costs marks: check the WHOLE trial polynomial for overlap, not just whether f(x) itself is a homogeneous solution.
id: ode-second-order-nonhomo.intuition.assured
concept_id: ode-second-order-nonhomo
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: ode-second-order-nonhomo.intuition
for_stance: assured
---

The undetermined-coefficients table assumes no overlap between $f(x)$'s trial family and $y_h$ — check that first, not just whether $f(x)$ itself is a homogeneous solution. For $y''-y'=x$ (roots $r=0,1$), the naive trial $y_p=Ax+B$ has a constant term $B$ that duplicates the $r=0$ solution $C_1$, even though $f(x)=x$ itself isn't a homogeneous solution. The fix is the same $x$-multiplication rule: try $y_p=x(Ax+B)=Ax^2+Bx$ instead. A tempting-but-wrong shortcut is checking overlap only at $f(x)$'s own degree or frequency, when the whole trial polynomial — every lower-degree term it drags in — needs the check.
