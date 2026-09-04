---
# Alternative body for diagonalization.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: diagonalization.hook.assured
concept_id: diagonalization
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: diagonalization.hook
for_stance: assured
---

Diagonalization writes $A = PDP^{-1}$: the same map, seen in the eigenvector basis, where it is pure scaling. Everything downstream — fast powers, matrix exponentials, decoupled systems — is this one substitution paying rent.

It fails exactly when some eigenvalue's geometric multiplicity falls short of its algebraic one. What's the smallest matrix where that happens?

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[4,1],[2,3]] — the rails are not perpendicular","duration_sec":9,"linear_map":{"matrix":[[4,1],[2,3]],"num_vectors":16,"eigen":[{"dir":[1,1],"value":5},{"dir":[1,-2],"value":2}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$ — not symmetric this time. Watch which two refuse to turn, and how they sit relative to each other.","text_shaken":"Sixteen arrows, each length 1, meet $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$. Two of them will not turn — watch where they end up.","text_assured":"$A$ is diagonalizable but not symmetric — expect real, independent eigen-rails, with no promise about the angle between them.","emphasize":false},{"at_progress":0.22,"text":"Push! Most arrows swing to a new direction while stretching — direction and length both changing, exactly like before.","text_shaken":"Watch any arrow off the two rails: it tilts to a new angle as it grows. Both direction and length are moving.","text_assured":"Off the two rails, $Av$ picks up a component away from $v$, so no scalar can satisfy $Av=\\lambda v$ there.","emphasize":false},{"at_progress":0.5,"focus_eigen":[0,1],"text":"Two arrows refuse to turn. The one along $(1,1)$ stretched by exactly 5. The one along $(1,-2)$ stretched by exactly 2. Before you check — do these two rails sit at a right angle, like they did for a symmetric matrix, or not?","text_shaken":"Check $(1,1)$: it grew to 5 times as long, same direction. Check $(1,-2)$: it grew to 2 times as long, same direction. Before you check the angle — right angle, like last time, or not?","text_assured":"$A(1,1)^T=(5,5)^T=5(1,1)^T$ and $A(1,-2)^T=(2,-4)^T=2(1,-2)^T$ — two real eigenvalues confirmed. Before you check the angle between the rails: orthogonal this time, or not?","emphasize":false},{"at_progress":0.6,"text":"Not a right angle — the angle between those two rails is nowhere near 90°. Symmetric matrices guarantee that right angle; this $A$ isn't symmetric, so nothing forces it.","text_shaken":"Not a right angle. The angle between $(1,1)$ and $(1,-2)$ is skewed, because this matrix, unlike a symmetric one, makes no such promise.","text_assured":"Skewed, not perpendicular — stretch factors 5 and 2, angle unforced. The right-angle guarantee only ever came from $A=A^T$, and this $A$ fails that test.","emphasize":true},{"at_progress":0.8,"text":"Diagonalizable just needs two independent rails — it never required a right angle. In eigen coordinates, $A$ is nothing but the pair (5, 2): pure scaling, no mixing.","text_shaken":"Two independent rails are all diagonalizing needs. No right angle required. In those coordinates, $A$ is just the numbers 5 and 2.","text_assured":"$P=\\begin{pmatrix}1&1\\\\1&-2\\end{pmatrix}$, $\\det P=-3\\neq0$: independent, so $A=PDP^{-1}$ with $D=\\mathrm{diag}(5,2)$ — angle irrelevant.","emphasize":false,"trap":{"text":"Students expect the two eigen-rails to sit at right angles, the way they did for a symmetric matrix — and read this skewed pair as proof $A$ cannot be diagonalized.","avoid":"Diagonalization only needs the eigenvectors linearly independent, not orthogonal — check $\\det P\\neq0$, never the angle between them."}}]}
```
