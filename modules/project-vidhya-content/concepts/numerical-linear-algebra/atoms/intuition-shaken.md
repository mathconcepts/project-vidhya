---
# Alternative body for numerical-linear-algebra.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-linear-algebra.intuition.shaken
concept_id: numerical-linear-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: numerical-linear-algebra-intuition
for_stance: shaken
---

## One Jacobi update, then the rule that makes it work

Take $4x+y=6,\ x+3y=5$. Solve each equation for its own diagonal unknown, and start guessing from $x_0=0,\,y_0=0$:

$$x_1=\frac{6-y_0}{4}=1.5,\qquad y_1=\frac{5-x_0}{3}\approx1.667$$

One round of substitution, no elimination at all, already lands closer to the exact answer, $x=13/11\approx1.182,\,y\approx1.273$, than the starting guess was. Keep repeating the same two updates with the newest numbers each time and the pair keeps closing in.

That is Jacobi iteration: trade the one-shot certainty of Gaussian elimination for a sequence of cheap updates, useful once a system is too large to eliminate directly. It does not always work — it converges only when $A$ is strictly diagonally dominant, meaning each diagonal entry's size exceeds the sum of the sizes of the rest of its row. Here $|4|>|1|$ and $|3|>|1|$, so the condition holds; reorder the same two equations and that guarantee can vanish even though the underlying system has not changed at all.
