---
# Alternative body for numerical-error-analysis.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-error-analysis.hook.assured
concept_id: numerical-error-analysis
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-error-analysis.hook
for_stance: assured
---

$E_a(pq)\approx|p|\,\delta q+|q|\,\delta p$ is a first-order approximation, trustworthy only while $\delta p/p$ and $\delta q/q$ stay small. Push it: $p=2\pm1$, $q=3\pm1$ gives $E_a(pq)\approx2(1)+3(1)=5$, so the rule claims $pq\in[1,11]$. The true extremes are $p\in[1,3]$, $q\in[2,4]$, giving $pq\in[2,12]$ — the rule's own bound does not even reach the actual maximum.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "The exact same $0.03$ cm gap reads as a rounding footnote on a beam and half the whole clearance on a micrometer gap — the same absolute error, two very different verdicts.", "title": "One fixed 0.03 cm gap, read against a shrinking quantity", "x_expr": "t", "y_expr": "0.03/t", "t_min": 0.06, "t_max": 12.47, "duration_sec": 7, "narration_steps": [{"at_progress": 0.0, "text": "At the $0.06$ cm clearance, the fixed $0.03$ cm gap is $50\\%$ of the whole quantity. Predict: as the measured quantity grows toward the beam's $12.47$ cm, does that percentage shrink a little, or by more than a hundredfold?", "focus_point": true}, {"at_progress": 0.15, "text": "By $1.92$ cm the same $0.03$ cm gap is already down to about $1.6\\%$ — most of the drop happens fast, while the quantity is still small.", "focus_point": true}, {"at_progress": 0.4, "text": "The gap itself never changes — only the size of what it's compared against does. Relative error is the absolute gap divided by the true value, so shrinking that denominator alone inflates the ratio."}, {"at_progress": 0.7, "text": "By $8.75$ cm the gap is already down near $0.34\\%$ — most of the fall happened long before reaching the beam.", "trap": {"text": "Students call a $0.03$ cm error 'small' from the number alone, regardless of what it is being measured against.", "avoid": "Always divide by the true value first — the same $0.03$ cm gap is half the whole clearance on the micrometer gap and a rounding footnote on the beam."}}, {"at_progress": 1.0, "text": "At the beam's $12.47$ cm, that same $0.03$ cm gap is only about $0.24\\%$ — a rounding footnote, not a defect.", "focus_point": true}]}
```
