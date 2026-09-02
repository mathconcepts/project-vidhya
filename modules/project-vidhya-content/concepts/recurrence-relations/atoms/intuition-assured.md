---
# Alternative body for recurrence-relations.intuition, stance `assured`.
id: recurrence-relations.intuition.assured
concept_id: recurrence-relations
atom_type: intuition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
variant_of: recurrence-relations.intuition
for_stance: assured
---

A linear homogeneous recurrence of order $2$ needs exactly two independent solutions to match two initial conditions. Distinct roots $r_1,r_2$ give $a_n=c_1r_1^n+c_2r_2^n$ directly. The distinction that costs marks: a **repeated** root $r$ (discriminant zero) does NOT give two copies of $r^n$ — the second independent solution is $n\cdot r^n$, so $a_n=(c_1+c_2n)r^n$.

Reaching for $a_n=c_1r^n+c_2r^n$ (which collapses to a single constant) on a repeated-root recurrence leaves one initial condition unsatisfiable — the telltale sign the root was repeated and the $nr^n$ term was skipped.
