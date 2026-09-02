---
# for_stance: shaken — one concrete triple-root example, full arithmetic, explicit check.
id: ode-higher-order.intuition.shaken
concept_id: ode-higher-order
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: ode-higher-order.intuition
for_stance: shaken
---

$y'''-3y''+3y'-y=0$. Start by writing down the auxiliary equation: $r^3-3r^2+3r-1=0$.

Recognize the pattern: $(r-1)^3=r^3-3r^2+3r-1$, so the equation is $(r-1)^3=0$ — one root, $r=1$, multiplicity $3$.

A repeated root of multiplicity $m$ contributes $(C_1+C_2x+\cdots+C_mx^{m-1})e^{rx}$; here $m=3$:
$$y=(C_1+C_2x+C_3x^2)e^{x}$$

Check: this is three arbitrary constants for a third-order equation — matches the count required.
