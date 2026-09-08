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
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-linear-algebra.hook
for_stance: shaken
---

$A=\begin{pmatrix}2&1\\4&3\end{pmatrix}$. Eliminate the first column: multiplier $m=4/2=2$, new row 2 is $(4,3)-2(2,1)=(0,1)$. That single subtraction is the entire first step of Gaussian elimination — record the multiplier, subtract, move to the next column.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Gauss-Seidel here shrinks the error by exactly 1/12 every sweep — an eigenvalue of its own update matrix — so a few sweeps already land almost exactly on the true answer.", "title": "Gauss-Seidel homing in on Ax=b, sweep by sweep", "x_expr": "13/11 + (7/22)*pow(1/12,t)", "y_expr": "14/11 - (7/66)*pow(1/12,t)", "t_min": 0, "t_max": 4, "duration_sec": 8, "narration_steps": [{"at_progress": 0.0, "text": "One Gauss-Seidel sweep from the guess $(0,0)$ already lands at $(1.5, 1.167)$. Predict: will the next sweep close most of the remaining gap, or barely dent it?", "focus_point": true}, {"at_progress": 0.25, "text": "Sweep two lands at $(1.208, 1.264)$ — the gap from the true answer shrank from about $0.32$ to about $0.03$: roughly a twelfth of what it was.", "focus_point": true}, {"at_progress": 0.5, "text": "Sweep three lands at $(1.184, 1.272)$ — another twelfth closer again, the exact same shrink as last time.", "focus_point": true}, {"at_progress": 0.65, "text": "That exact twelfth every sweep is $1/12$ — an eigenvalue of Gauss-Seidel's own update rule for this system, not a coincidence of the starting numbers chosen here."}, {"at_progress": 0.85, "text": "Diagonal dominance guaranteed this sweep converges — but it isn't the only guarantee available.", "trap": {"text": "Students think diagonal dominance is the only condition that can guarantee Gauss-Seidel converges.", "avoid": "A symmetric positive-definite matrix guarantees convergence too, even without diagonal dominance — this system's own matrix happens to be both."}}, {"at_progress": 1.0, "text": "By sweep four the point sits at $(1.182, 1.273)$ — indistinguishable at this precision from the exact answer $(13/11, 14/11)$.", "focus_point": true}]}
```
