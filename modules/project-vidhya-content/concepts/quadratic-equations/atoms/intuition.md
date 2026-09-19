---
id: quadratic-equations.intuition
concept_id: quadratic-equations
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Picture the graph of $y = ax^2+bx+c$ — a bowl-shaped curve (opening upward if $a>0$, downward if $a<0$). The **roots** of $ax^2+bx+c=0$ are exactly where this curve touches or crosses the horizontal axis. A curve can cross it twice, touch it once, or miss it completely — three pictures, three outcomes.

The **discriminant** $D=b^2-4ac$ is the one number that tells you which picture you have, without drawing anything: $D>0$ means two crossing points (real, distinct roots); $D=0$ means the curve just grazes the axis at one point (a repeated root); $D<0$ means the curve never touches the axis at all (no real roots — the two roots exist only as a complex-conjugate pair).

The **sum and product of roots** come from working backwards from factoring: if the roots are $\alpha$ and $\beta$, then $ax^2+bx+c = a(x-\alpha)(x-\beta)$. Expanding this and matching coefficients gives $\alpha+\beta = -b/a$ and $\alpha\beta = c/a$ — you can read off both sums and products straight from $a$, $b$, $c$, without ever solving for the roots individually.
