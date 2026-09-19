---
id: complex-numbers-algebra.intuition-assured
concept_id: complex-numbers-algebra
atom_type: intuition
variant_of: complex-numbers-algebra.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Modulus as distance and argument as angle, combining into polar form, are familiar. The distinction that costs marks: the **principal argument** is bounded to $(-\pi, \pi]$, but De Moivre's theorem and repeated multiplication can push the *actual* angle far beyond that range — and the two must not be confused.

Take $z$ with argument $150°$ and cube it. Naively adding $150°+150°+150°=450°$ gives the *actual* rotation, but the **principal** argument of $z^3$ is $450°-360°=90°$, not $450°$. Report $450°$ as "the argument" on an exam and it is marked wrong, even though the rotation genuinely happened — the principal value is defined to always land back inside one standard $360°$ window.

This is exactly the subtlety inside cube roots of unity: $\omega$ has argument $120°$, and $\omega^3$ rotates by $360°$ total, landing back at argument $0°$ (not "$360°$", which is outside the principal range). Always reduce a computed angle modulo $360°$ into the principal window before stating it as a final argument.
