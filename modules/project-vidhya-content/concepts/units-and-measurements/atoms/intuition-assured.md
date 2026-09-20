---
id: units-and-measurements.intuition-assured
concept_id: units-and-measurements
atom_type: intuition
variant_of: units-and-measurements.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.05
exam_ids: ["*"]
---

Combining-rule bookkeeping is quick once practised. What separates a full-marks answer here: an **exact (defined) number carries zero error and never limits significant figures**, whatever the formula looks like.

In $C = 2\pi r$, the $2$ is a pure count, not a measurement — it has infinitely many significant figures and contributes nothing to the error in $C$. Only $r$ (measured) and, if used as a rounded decimal, $\pi$'s truncation matter.

A student computing the error in $C=2\pi r$ who treats the $2$ as "roughly known" and splits the error budget across three terms will *understate* the real relative error contributed by $r$ alone — the genuine error lives entirely in $r$ (and in how many digits of $\pi$ were used), never in the exact factor of $2$. Spotting which numbers in a formula are counted/defined versus measured, rather than reflexively applying a propagation formula, is the actual skill an examiner is checking for.

