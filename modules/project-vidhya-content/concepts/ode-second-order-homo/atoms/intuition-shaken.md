---
# for_stance: shaken — one concrete example walked end to end, full arithmetic, explicit check.
id: ode-second-order-homo.intuition.shaken
concept_id: ode-second-order-homo
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: ode-second-order-homo.intuition
for_stance: shaken
---

$y''-5y'+6y=0$. First step: substitute $y=e^{rx}$, giving $ar^2+br+c=0$ with $a=1,b=-5,c=6$: $r^2-5r+6=0$. Factor: $(r-2)(r-3)=0$, so $r=2$ or $r=3$.

Two distinct real roots means two solutions, $e^{2x}$ and $e^{3x}$, and the general solution is their combination:
$$y=C_1e^{2x}+C_2e^{3x}$$

Check: differentiate twice.
$$y''-5y'+6y=(4-10+6)C_1e^{2x}+(9-15+6)C_2e^{3x}=0$$

If instead the discriminant $b^2-4ac$ came out zero, the second solution would be $xe^{rx}$, not a second exponential — that is the one case to remember separately.
