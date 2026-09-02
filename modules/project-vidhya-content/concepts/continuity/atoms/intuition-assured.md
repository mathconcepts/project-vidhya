---
# Alternative body for continuity.intuition, served when the learner
# stance is `assured`. Assumes the three-types picture; spends words on
# the distinction that costs marks.
id: continuity.intuition.assured
concept_id: continuity
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: continuity.intuition
for_stance: assured
---

The distinction worth the marks: only a **removable** discontinuity can be patched by redefining one point — a jump can't be fixed at all, because the two one-sided limits genuinely disagree, and no single value satisfies both. Students who correctly identify "the function isn't continuous here" often stop one step short of the actual GATE question, which is usually "classify the discontinuity" or "state whether it's removable," not merely flag its existence.

The fast diagnostic: compute both one-sided limits first. Equal and finite $\Rightarrow$ removable (check separately whether $f(a)$ matches). Unequal but both finite $\Rightarrow$ jump, unfixable. Either infinite $\Rightarrow$ infinite discontinuity, unfixable. The classification falls out of the one-sided limits alone, before you ever look at $f(a)$.
