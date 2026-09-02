---
# Alternative body for line-integrals.intuition, served when the learner
# stance is `assured`.
id: line-integrals.intuition.assured
concept_id: line-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.12
exam_ids: ["*"]
modality: visual
variant_of: line-integrals.intuition
for_stance: assured
---

A closed curve does **not** force $\int_C\mathbf F\cdot d\mathbf r=0$ — that conclusion needs $\mathbf F$ conservative on a simply connected domain, not merely a closed path. $\mathbf F=(-y,x)$ traced around the unit circle is exactly this trap: closed, yet the integral is $2\pi\ne0$, because $\operatorname{curl}\mathbf F=2\ne0$ — not conservative.

Contrast a conservative field: $\oint_C\mathbf F\cdot d\mathbf r=0$ for every closed $C$ in its domain, no exceptions, because the total collapses to $\phi(\text{end})-\phi(\text{start})$ and start equals end on a loop. Reaching for "closed loop, so the answer is zero" without checking conservativity first hands in $0$ where the real answer is $2\pi$.
