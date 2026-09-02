---
id: taylor-laurent.intuition
concept_id: taylor-laurent
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
---

**Taylor series** expand analytic functions around ordinary points: $f(z)=\sum_{n=0}^\infty a_n(z-z_0)^n$, with $a_n=f^{(n)}(z_0)/n!$ encoding every derivative at the expansion point. Within the radius of convergence, the function *is* the series — no information lost.

**Laurent series** generalize this near singularities: $f(z)=\sum_{n=-\infty}^\infty a_n(z-z_0)^n$. Negative-power terms ($n<0$) form the **principal part**, capturing what happens approaching the singularity; non-negative terms form the **regular part**.

Singularity classification becomes automatic once the series is centered *at* the singularity: zero principal-part terms is **removable**; exactly $m$ negative powers (worst term $(z-z_0)^{-m}$) is a **pole of order $m$**; infinitely many is **essential**. The coefficient $a_{-1}$ is the **residue** — it feeds directly into the residue theorem, no further computation needed.

Master the mechanics first — partial fractions, geometric series, substitution — then classification and the residue both fall straight out of the series by inspection.
