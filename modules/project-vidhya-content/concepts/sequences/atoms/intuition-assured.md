---
# Alternative body for sequences.intuition, served when the learner stance
# is `assured`. Terse, assumes the mental model, spends words on the
# distinction that costs marks rather than re-teaching it.
id: sequences.intuition.assured
concept_id: sequences
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: sequences.intuition
for_stance: assured
---

The distinction that actually costs marks: convergence only constrains the **tail** of a sequence, never any finite prefix. Change or delete the first million terms of a convergent sequence and the limit is untouched, because "for every $\epsilon>0$ there exists $N$" only ever asks about $n>N$ — never about how the sequence starts. A sequence can wander wildly for its first thousand terms and still converge; one can sit beautifully close to $L$ for those thousand terms and still diverge later.

Where students lose marks: treating "the terms look close to $L$ for the values I checked" as proof of convergence. It is evidence, never proof — the definition requires the closeness to persist for **every** later index, not just the ones computed by hand. A candidate limit has to be checked against the tail's behavior, never against the launch.
