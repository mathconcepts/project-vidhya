---
# Alternative body for sets-relations.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: sets-relations.intuition.shaken
concept_id: sets-relations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["gate-ma"]
scaffold_fade: 0
variant_of: sets-relations-intuition
for_stance: shaken
---

Let $A=\{1,2\}$ and $B=\{2,3\}$. Write out $A\cup B$ by hand: every element in either set, no repeats — $\{1,2,3\}$. Write out $A\cap B$: only what's in both — $\{2\}$. Count them: $|A|=2$, $|B|=2$, $|A\cap B|=1$, and $|A\cup B|=3$. Check the inclusion-exclusion rule against those actual numbers: $2+2-1=3$ — matches.

Now a relation. Let $A=\{1,2,3\}$ and define $aRb$ to mean $a\le b$. List every pair by hand: $(1,1),(1,2),(1,3),(2,2),(2,3),(3,3)$. Check reflexive first, one case: does $1R1$ hold? Yes, $1\le1$. Check it for every element the same way — all three hold, so reflexive. Check symmetric on one pair: $1R2$ holds since $1\le2$, but does $2R1$ hold? No, $2\le1$ is false — not symmetric. Check antisymmetric: whenever $aRb$ and $bRa$ both hold, is $a=b$? The only way both can hold here is $a=b$ itself, so yes, antisymmetric. Check transitive on one chain: $1R2$ and $2R3$, does $1R3$ hold? Yes.

Reflexive, antisymmetric, and transitive together made this a partial order — symmetry was the property it never had.
