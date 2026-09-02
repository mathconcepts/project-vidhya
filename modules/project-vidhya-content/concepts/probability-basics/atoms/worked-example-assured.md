---
# Alternative body for probability-basics.worked-example, served when the
# learner stance is `assured`. See src/content/stance-variants.ts.
id: probability-basics.worked-example.assured
concept_id: probability-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: probability-basics.worked-example
for_stance: assured
---

Same test, same numbers, $\boxed{P(D\mid\text{pos})=1/6}$. The number worth carrying forward isn't the arithmetic — it's the shape: with a 99%-accurate test and a 1%-prevalent condition, most positives are still false. That's not a flaw in the test; it's what happens whenever the false-positive population ($0.05\times9900=495$) outnumbers the true-positive population ($0.99\times100=99$), which happens exactly when the condition is rarer than the test's error rate. The fast diagnostic: compare $P(\bar D)\cdot(\text{false-positive rate})$ against $P(D)\cdot(\text{sensitivity})$ before computing anything — whichever is larger dominates the posterior, and here the healthy population's error swamps the sick population's correct detections five to one.
