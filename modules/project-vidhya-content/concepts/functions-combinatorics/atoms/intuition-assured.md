---
# Alternative body for functions-combinatorics.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: functions-combinatorics.intuition.assured
concept_id: functions-combinatorics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["gate-ma"]
scaffold_fade: 0
variant_of: functions-combinatorics-intuition
for_stance: assured
---

Order-versus-not is the one question every counting problem answers before any formula gets written: $P(n,r)=\frac{n!}{(n-r)!}$ when arrangement matters, $C(n,r)=\binom{n}{r}=\frac{n!}{r!(n-r)!}$ when it doesn't, related by $P(n,r)=r!\,C(n,r)$.

On functions, keep the conditions exact: injective needs $|A|\le|B|$, but that alone doesn't force injectivity — it's necessary, nowhere near sufficient. Same for surjective and $|A|\ge|B|$. Bijective needs both conditions to hold AND the map itself to satisfy them; $|A|=|B|$ alone proves nothing without checking the actual assignment.

Pigeonhole is an existence claim, not a count: $n+1$ items into $n$ containers guarantees a collision but never says which container or how many pile up beyond one. Inclusion-exclusion alternates sign by how many sets are intersected — a fourth-set term flips back to positive, and dropping it under time pressure quietly doubles the true union.
