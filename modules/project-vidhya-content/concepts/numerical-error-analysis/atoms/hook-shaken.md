---
# Alternative body for numerical-error-analysis.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-error-analysis.hook.shaken
concept_id: numerical-error-analysis
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-error-analysis.hook
for_stance: shaken
---

A resistor reads $100.0\,\Omega$ on the meter; its true value is $99.7\,\Omega$. The gap is $0.3\,\Omega$ — tiny next to $100$. Put that same $0.3\,\Omega$ gap on a $1\,\Omega$ resistor instead and it is the whole thing, twice over. The raw gap never tells you whether an error is serious; only the gap divided by the size of what you measured does.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "The exact same $0.03$ cm gap reads as a rounding footnote on a beam and half the whole clearance on a micrometer gap — the same absolute error, two very different verdicts.", "title": "One fixed 0.03 cm gap, read against a shrinking quantity", "x_expr": "t", "y_expr": "0.03/t", "t_min": 0.06, "t_max": 12.47, "duration_sec": 7, "narration_steps": [{"at_progress": 0.0, "text": "At the $0.06$ cm clearance, the fixed $0.03$ cm gap is $50\\%$ of the whole quantity. Predict: as the measured quantity grows toward the beam's $12.47$ cm, does that percentage shrink a little, or by more than a hundredfold?", "focus_point": true}, {"at_progress": 0.15, "text": "By $1.92$ cm the same $0.03$ cm gap is already down to about $1.6\\%$ — most of the drop happens fast, while the quantity is still small.", "focus_point": true}, {"at_progress": 0.4, "text": "The gap itself never changes — only the size of what it's compared against does. Relative error is the absolute gap divided by the true value, so shrinking that denominator alone inflates the ratio."}, {"at_progress": 0.7, "text": "By $8.75$ cm the gap is already down near $0.34\\%$ — most of the fall happened long before reaching the beam.", "trap": {"text": "Students call a $0.03$ cm error 'small' from the number alone, regardless of what it is being measured against.", "avoid": "Always divide by the true value first — the same $0.03$ cm gap is half the whole clearance on the micrometer gap and a rounding footnote on the beam."}}, {"at_progress": 1.0, "text": "At the beam's $12.47$ cm, that same $0.03$ cm gap is only about $0.24\\%$ — a rounding footnote, not a defect.", "focus_point": true}]}
```
