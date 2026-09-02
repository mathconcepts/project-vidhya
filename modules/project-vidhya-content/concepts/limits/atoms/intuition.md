---
id: limits.intuition
concept_id: limits
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Trace a function's graph with a pencil as $x$ slides toward some value $a$ — from the left, then from the right. If both approaches land the pencil at the same height, that height is the limit, whether or not the function is even drawn at $a$ itself. A limit asks nothing about the point $x=a$; it only asks what the graph is doing in every neighborhood squeezed around it.

Three shapes account for almost every graph you'll meet. A smooth curve with a hole punched at $x=a$ — both sides converge to the same missing height, and the limit exists even though $f(a)$ doesn't. A curve that steps up or down at $x=a$ — the left approach and the right approach land at *different* heights, so no single limit exists there, even though the function is perfectly well-defined on both sides. A curve that shoots off toward $\pm\infty$ near $x=a$ — neither side settles at any finite height at all.

Only the first shape gives you a usable finite limit for free. The other two are exactly why "does the limit exist" is a real question and not a formality — checking both one-sided approaches, separately, is the only way to know which shape you're looking at before committing to an answer.
