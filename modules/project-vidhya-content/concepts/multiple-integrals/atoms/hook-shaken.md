---
# Alternative body for multiple-integrals.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: multiple-integrals.hook.shaken
concept_id: multiple-integrals
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: multiple-integrals.hook
for_stance: shaken
---

A plate's density varies. To find total mass: cut it into a grid. Each small rectangle: multiply its own area by its own density. Add every piece.

Do this twice — once summing across one direction, once across the other. Shrink every rectangle to a point, and the sum becomes an integral, run twice: a double integral.

Check: does "multiply area by density everywhere, then add" match what a CONSTANT density would give? Yes — it reduces to density times total area, the case you already know.
