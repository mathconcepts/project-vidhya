---
id: numerical-error-analysis.hook
concept_id: numerical-error-analysis
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

You measure a beam's length as 12.5 cm; the true length is 12.47 cm. Is that a "big" mistake or a "small" one? A gap of 0.03 cm sounds tiny — until you're measuring a bridge girder's micrometer clearance instead of a beam, where the same 0.03 cm could be catastrophic. Whether an error matters isn't about the raw gap; it's about the gap *relative to* the quantity being measured, and that is exactly what error analysis makes precise.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "The exact same $0.03$ cm gap reads as a rounding footnote on a beam and half the whole clearance on a micrometer gap — the same absolute error, two very different verdicts.", "title": "One fixed 0.03 cm gap, read against a shrinking quantity", "x_expr": "t", "y_expr": "0.03/t", "t_min": 0.06, "t_max": 12.47, "duration_sec": 7, "narration_steps": [{"at_progress": 0.0, "text": "At the $0.06$ cm clearance, the fixed $0.03$ cm gap is $50\\%$ of the whole quantity. Predict: as the measured quantity grows toward the beam's $12.47$ cm, does that percentage shrink a little, or by more than a hundredfold?", "focus_point": true}, {"at_progress": 0.15, "text": "By $1.92$ cm the same $0.03$ cm gap is already down to about $1.6\\%$ — most of the drop happens fast, while the quantity is still small.", "focus_point": true}, {"at_progress": 0.4, "text": "The gap itself never changes — only the size of what it's compared against does. Relative error is the absolute gap divided by the true value, so shrinking that denominator alone inflates the ratio."}, {"at_progress": 0.7, "text": "By $8.75$ cm the gap is already down near $0.34\\%$ — most of the fall happened long before reaching the beam.", "trap": {"text": "Students call a $0.03$ cm error 'small' from the number alone, regardless of what it is being measured against.", "avoid": "Always divide by the true value first — the same $0.03$ cm gap is half the whole clearance on the micrometer gap and a rounding footnote on the beam."}}, {"at_progress": 1.0, "text": "At the beam's $12.47$ cm, that same $0.03$ cm gap is only about $0.24\\%$ — a rounding footnote, not a defect.", "focus_point": true}]}
```
