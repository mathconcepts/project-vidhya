---
# Alternative body for counting-principles.intuition, served when the
# learner stance is `shaken`. See src/content/stance-variants.ts.
#
# Smallest true first step, concrete numbers before symbols, arithmetic in
# full, explicit check at the end. No reassurance language.
id: counting-principles.intuition.shaken
concept_id: counting-principles
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: counting-principles.intuition
for_stance: shaken
---

Look at 3 books: A, B, C.

Slot 1 can be A, B, or C — 3 choices. Slot 2 uses whichever 2 books are left — 2 choices. Slot 3 uses the 1 book left — 1 choice.

Total orders: $3\times2\times1=6$.

Now suppose order doesn't matter — you're just picking which 3 books sit on the shelf together, and there's only one way to pick all 3 of 3. Each group of chosen books got counted once per ordering in the list above, so divide the ordered count by the number of orderings of the group to remove that repeat.

Check: 6 orderings of 3 books, 1 unordered group, $6/3! = 6/6=1$ group. Matches.
