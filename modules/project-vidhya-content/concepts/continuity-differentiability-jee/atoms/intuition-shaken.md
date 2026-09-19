---
id: continuity-differentiability-jee.intuition-shaken
concept_id: continuity-differentiability-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
variant_of: continuity-differentiability-jee.intuition
for_stance: shaken
---

Take $f(x)=|x|$. At $x=0$: is the pencil ever lifted off the paper drawing this graph? No — it is one unbroken V-shape. So $f$ is continuous at $0$. Now zoom in close on the corner at $x=0$. Does it start looking like one straight line? No — it always looks like two lines meeting: slope $-1$ on the left, slope $+1$ on the right. Those two numbers disagree, so no single "the slope here" exists. That is differentiability failing while continuity holds.

The chain rule works like two gears turning together. Turn the inner gear a small amount; the outer gear turns by that amount times its own sensitivity to the inner one. For $f(g(x))$: a small change in $x$ changes $g(x)$ first, and that change then changes $f(g(x))$ — multiply the two rates, do not add them, because the second change only exists because the first one happened.
