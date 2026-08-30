---
# Alternative body for numerical-linear-algebra.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-linear-algebra.hook.shaken
concept_id: numerical-linear-algebra
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: numerical-linear-algebra.hook
for_stance: shaken
---

Solve $4x+y=6,\ x+3y=5$ by hand and $x=13/11\approx1.1818$. Now picture that same system with a thousand unknowns — hand elimination is out. Start from any guess, $0$ say, and update each variable from the others instead: one round already gives $x\approx1.5,\ y\approx1.667$, closer than the guess you began with.
