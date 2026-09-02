---
id: taylor-laurent.exam-pattern
concept_id: taylor-laurent
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want one coefficient, not the whole series** — usually $a_{-1}$ (the residue) or the radius of convergence, extracted from an expansion you're expected to set up yourself.

  Example: radius of convergence of $\frac1{1+z^2}$ about $z=0$. Nearest singularity is at $z=\pm i$, distance $1$ from the origin — radius $=1$, no series expansion actually needed to answer it.

- **MCQ questions on singularity type** give a function and a handful of classification options (removable / pole of order $k$ / essential), testing whether the principal part was counted correctly, not whether the full series was written out.

- **MSQ "which annulus" questions test that a Laurent series is annulus-specific**: the same partial-fraction term expands differently depending on whether $|z|$ is above or below the nearby pole's modulus — a correct answer names the annulus, not just the series.

- **Time budget:** identifying which singularity is nearest (for a radius of convergence) should cost under 30 seconds; a full Laurent expansion with classification, under two minutes. Longer than that on the radius question specifically usually means an unnecessary series expansion was attempted instead of just comparing distances.
