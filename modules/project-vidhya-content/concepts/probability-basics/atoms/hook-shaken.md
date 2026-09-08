---
# Alternative body for probability-basics.hook, served when the learner
# stance is `shaken`. See src/content/stance-variants.ts.
id: probability-basics.hook.shaken
concept_id: probability-basics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: probability-basics.hook
for_stance: shaken
---

A weather app says 70% chance of rain.

That number obeys three fixed rules: it's between 0 and 1, a certain event scores 1, and probabilities of things that can't both happen just add.

$$0 \le P(A) \le 1, \qquad P(\text{certain event}) = 1$$

Those three rules are the entire foundation. Everything else in this topic — conditional probability, Bayes' theorem — is built from just these.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "The same 99%-sensitive, 95%-specific test gives very different posteriors depending on how rare the disease already is — dragging the prior up shows why 'accurate test' isn't 'trustworthy positive'.", "title": "Same test, sliding prior: watch the posterior move", "x_expr": "t", "y_expr": "(0.99*t)/(0.99*t+0.05*(1-t))", "t_min": 0.01, "t_max": 0.5, "duration_sec": 7, "narration_steps": [{"at_progress": 0.0, "text": "This test is $99\\%$ sensitive, $95\\%$ specific. At a $1\\%$ disease prior, a positive result gives posterior $P(D\\mid\\text{pos})=1/6\\approx0.167$ — mostly a false alarm. Predict: at a $50\\%$ prior, is the posterior a little higher, or nearly certain?", "focus_point": true}, {"at_progress": 0.25, "text": "Raise the prior to just $13\\%$ and the posterior jumps to about $0.75$ — most of the rise happens fast, while the disease is still fairly rare.", "focus_point": true}, {"at_progress": 0.5, "text": "The jump is steep early because when disease is rare, the healthy people the test still flags by accident dwarf the few who are actually sick — even a small rise in prior shrinks that dwarfing fast."}, {"at_progress": 0.75, "text": "By a $38\\%$ prior the posterior already exceeds $0.92$.", "focus_point": true, "trap": {"text": "Students treat the test's own $99\\%$ sensitivity as if it already were the answer — the chance a positive result means disease.", "avoid": "Sensitivity is $P(\\text{pos}\\mid D)$, not $P(D\\mid\\text{pos})$ — the posterior also depends on the prior, and the two match only once the prior itself is already large."}}, {"at_progress": 1.0, "text": "At a coin-flip $50\\%$ prior, the posterior is about $0.95$ — nearly the test's own sensitivity, because with disease this common, false positives from the healthy majority no longer dominate.", "focus_point": true}]}
```
