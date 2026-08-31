---
# Alternative body for diagonalization.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: diagonalization.hook.shaken
concept_id: diagonalization
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: diagonalization.hook
for_stance: shaken
---

Push arrows through $A=\begin{pmatrix}4&1\\2&3\end{pmatrix}$.

Two of them refuse to turn — one stretched ×5, the other ×2.

Look at the angle between those two: not 90°. $A$ is not symmetric, so its rails do not have to be perpendicular — just independent.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[4,1],[2,3]] — the rails are not perpendicular","duration_sec":9,"linear_map":{"matrix":[[4,1],[2,3]],"num_vectors":16,"eigen":[{"dir":[1,1],"value":5},{"dir":[1,-2],"value":2}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$ — not symmetric this time. Watch which two refuse to turn, and how they sit relative to each other.","text_shaken":"Sixteen arrows, each length 1, meet $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$. Two of them will not turn — watch where they end up.","text_assured":"$A$ is diagonalizable but not symmetric — expect real, independent eigen-rails, with no promise about the angle between them.","emphasize":false},{"at_progress":0.22,"text":"Push! Most arrows swing to a new direction while stretching — direction and length both changing, exactly like before.","text_shaken":"Watch any arrow off the two rails: it tilts to a new angle as it grows. Both direction and length are moving.","text_assured":"Off the two rails, $Av$ picks up a component away from $v$, so no scalar can satisfy $Av=\\lambda v$ there.","emphasize":false},{"at_progress":0.55,"text":"Two arrows refuse to turn. The one along $(1,1)$ stretched by exactly 5. The one along $(1,-2)$ stretched by exactly 2 — and the angle between those two rails is nowhere near 90°.","text_shaken":"Check $(1,1)$: it grew to 5 times as long, same direction. Check $(1,-2)$: it grew to 2 times as long, same direction. The angle between them is not a right angle.","text_assured":"$A(1,1)^T=(5,5)^T=5(1,1)^T$ and $A(1,-2)^T=(2,-4)^T=2(1,-2)^T$ — two real eigenvalues, rails skewed, not perpendicular.","emphasize":true},{"at_progress":0.8,"text":"Diagonalizable just needs two independent rails — it never required a right angle. In eigen coordinates, $A$ is nothing but the pair (5, 2): pure scaling, no mixing.","text_shaken":"Two independent rails are all diagonalizing needs. No right angle required. In those coordinates, $A$ is just the numbers 5 and 2.","text_assured":"$P=\\begin{pmatrix}1&1\\\\1&-2\\end{pmatrix}$, $\\det P=-3\\neq0$: independent, so $A=PDP^{-1}$ with $D=\\mathrm{diag}(5,2)$ — angle irrelevant.","emphasize":false,"trap":{"text":"Students expect the two eigen-rails to sit at right angles, the way they did for a symmetric matrix — and read this skewed pair as proof $A$ cannot be diagonalized.","avoid":"Diagonalization only needs the eigenvectors linearly independent, not orthogonal — check $\\det P\\neq0$, never the angle between them."}}]}
```
