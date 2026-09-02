---
id: differentiability.formal_definition
concept_id: differentiability
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Differentiability at a point.** $f$ is **differentiable** at $x=a$ if

$$
f'(a) = \lim_{h\to 0}\frac{f(a+h)-f(a)}{h}
$$

exists (as a single finite real number). This requires the one-sided limits — the left-hand derivative ($h\to0^-$) and right-hand derivative ($h\to0^+$) — to exist **and agree**.

**Theorem:** if $f$ is differentiable at $a$, then $f$ is continuous at $a$. The converse is **false** — $f(x)=|x|$ is continuous but not differentiable at $x=0$.

**Method selector:** at a piecewise function's join point, check differentiability by computing the **left-hand and right-hand derivatives directly from the definition** on each piece — not by eyeballing whether the graph "looks smooth," a visual heuristic that fails silently on constructions like $x^{1/3}$ (a vertical tangent, invisible at a glance) and gives false confidence exactly where the exam is testing precision.
