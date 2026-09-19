---
id: continuity-differentiability-jee.intuition
concept_id: continuity-differentiability-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
---

Continuity asks one question: can the pencil stay on the paper while drawing the graph, with no lifting and no jumping? Differentiability asks a second, stricter question: zoomed in close enough at a point, does the curve look like a *single* straight line from every direction? At a smooth point, yes — the curve and its tangent become indistinguishable up close. At a corner, no — no matter how far you zoom in, you still see two different lines meeting, one arriving from the left and a different one leaving to the right. Continuous, because the pencil never left the paper; not differentiable, because "the direction at this instant" has two disagreeing answers.

The chain rule is the same idea applied to a machine built from two gears. Turning the inner gear by a tiny amount turns the outer gear by some multiple of that amount — the outer gear's own sensitivity to the inner one. Composing $f(g(x))$ is exactly this: a change in $x$ drives a change in $g(x)$, which in turn drives a change in $f(g(x))$, and the two rates of change multiply rather than add, because each gear's turn depends on how far the one before it already turned.
