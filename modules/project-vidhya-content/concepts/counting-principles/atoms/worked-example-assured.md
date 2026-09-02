---
# Alternative body for counting-principles.worked-example, served when the
# learner stance is `assured`. See src/content/stance-variants.ts.
id: counting-principles.worked-example.assured
concept_id: counting-principles
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: counting-principles.worked-example
for_stance: assured
---

Same team-of-4 problem. Complement wins here because "fewer than 2 women" is only 2 cases against 3 direct cases — but that comparison is worth making explicit, not assumed. $C(9,4)-C(4,4)-C(5,1)C(4,3) = 126-1-20=\boxed{105}$.

The general rule: complement is faster whenever the *excluded* condition has strictly fewer sub-cases than the *included* one. For "at least $k$" out of $n$ chosen from a group of size $m+w$, count excluded cases $0,\dots,k-1$ against included cases $k,\dots,n$ — pick whichever side is shorter before computing either. Don't default to complement out of habit; a condition like "at least $n-1$" usually has the *direct* count as the shorter side.
