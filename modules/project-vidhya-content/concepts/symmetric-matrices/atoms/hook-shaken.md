---
# Alternative body for symmetric-matrices.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: symmetric-matrices.hook.shaken
concept_id: symmetric-matrices
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: symmetric-matrices.hook
for_stance: shaken
---

Take $A=\begin{pmatrix}3&1\\1&3\end{pmatrix}$. Flip it over its diagonal — rows become columns — and you get the same matrix back.

That is symmetric: $A=A^T$.

Symmetric matrices get one free guarantee: their two stubborn directions always sit at a right angle. Watch the animation find both, and check the angle yourself.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[3,1],[1,3]] — two land at a right angle","duration_sec":9,"linear_map":{"matrix":[[3,1],[1,3]],"num_vectors":16,"eigen":[{"dir":[1,1],"value":4},{"dir":[1,-1],"value":2}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows, each length 1, are about to be pushed through $A=\\begin{pmatrix}3&1\\\\1&3\\end{pmatrix}$. Watch which two never turn.","text_shaken":"Sixteen arrows on a circle, each length 1. Push them all through $A=\\begin{pmatrix}3&1\\\\1&3\\end{pmatrix}$ and watch what happens to each tip.","text_assured":"A symmetric $A$ — so before anything moves, you already know: real eigenvalues, and the invariant directions perpendicular.","emphasize":false},{"at_progress":0.22,"text":"Push! Nearly every arrow tilts to a new angle while it stretches — direction and length both change at once.","text_shaken":"Watch any arrow off the diagonal: it swings sideways as it grows. Direction and length are both changing.","text_assured":"Off the two special lines, $Av$ picks up a component away from $v$ — direction turns, so $Av\\neq\\lambda v$.","emphasize":false},{"at_progress":0.55,"focus_eigen":[0,1],"text":"Two arrows refuse to turn. The up-right arrow $(1,1)$ stretched to 4 times its length. The other, $(1,-1)$, stretched by exactly 2 — and the two sit at a perfect right angle.","text_shaken":"Check $(1,1)$: it grew to 4 times as long, same direction. Check $(1,-1)$: it grew to 2 times as long, same direction. Between them: 90°, exactly.","text_assured":"$A(1,1)^T=(4,4)^T$ and $A(1,-1)^T=(2,-2)^T$ — stretch factors 4 and 2, perpendicular directions, exactly as symmetry promises.","emphasize":true},{"at_progress":0.65,"focus_eigen":[0,1],"text":"Two directions that never turn, sitting at a perfect right angle — is that guaranteed for a matrix like this, or just how this example happened to turn out?","text_shaken":"The two directions landed at 90°. Guess: is that guaranteed to happen, or just luck for this particular matrix?","text_assured":"A right angle between two eigenvector directions — automatic here, or a coincidence of this particular $A$? Predict before the next beat.","emphasize":false},{"at_progress":0.72,"text":"Guaranteed. An arrow a matrix stretches but never turns is an eigenvector, its stretch factor the eigenvalue — 4 and 2 here. Because $A=A^T$, those two directions are forced to be perpendicular, every time.","text_shaken":"Guaranteed — not luck. An arrow that keeps its direction is an eigenvector. Its stretch factor is the eigenvalue — 4 and 2 here. Because $A=A^T$, the two always meet at 90°.","text_assured":"Guaranteed: because $A=A^T$, those two eigenvector directions are forced to be perpendicular, every time — no dot-product check ever needed for a symmetric matrix.","emphasize":true},{"at_progress":0.8,"text":"Check: trace $=6=4+2$ and $\\det=8=4\\times2$ — the two-second test before you trust computed eigenvalues.","text_shaken":"Check: $4+2=6$, trace of $A$. Check: $4\\times2=8$, determinant of $A$. Both match — the eigenvalues are right.","text_assured":"Check: trace $=6=4+2$ and $\\det=8=4\\times2$ — the two-second test before you trust computed eigenvalues.","emphasize":false,"trap":{"text":"Students laboriously compute the dot product to check these two eigenvectors are perpendicular.","avoid":"Skip the check: for symmetric A with distinct eigenvalues, orthogonal eigenvectors are guaranteed by the spectral theorem."}}]}
```
