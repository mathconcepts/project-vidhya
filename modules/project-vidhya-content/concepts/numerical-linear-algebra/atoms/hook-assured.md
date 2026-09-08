---
# Alternative body for numerical-linear-algebra.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-linear-algebra.hook.assured
concept_id: numerical-linear-algebra
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-linear-algebra.hook
for_stance: assured
---

A clean elimination with no arithmetic slips can still hand back a solution that's practically meaningless: if $\kappa(A)=\|A\|\|A^{-1}\|$ is large, a tiny perturbation in $b$ (rounding, measurement noise) amplifies into a large error in $x$, regardless of how carefully $L$ and $U$ were computed. Pivoting fixes a different problem — numerical instability *during* elimination — and does nothing for a matrix that is simply, structurally, close to singular.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Gauss-Seidel here shrinks the error by exactly 1/12 every sweep — an eigenvalue of its own update matrix — so a few sweeps already land almost exactly on the true answer.", "title": "Gauss-Seidel homing in on Ax=b, sweep by sweep", "x_expr": "13/11 + (7/22)*pow(1/12,t)", "y_expr": "14/11 - (7/66)*pow(1/12,t)", "t_min": 0, "t_max": 4, "duration_sec": 8, "narration_steps": [{"at_progress": 0.0, "text": "One Gauss-Seidel sweep from the guess $(0,0)$ already lands at $(1.5, 1.167)$. Predict: will the next sweep close most of the remaining gap, or barely dent it?", "focus_point": true}, {"at_progress": 0.25, "text": "Sweep two lands at $(1.208, 1.264)$ — the gap from the true answer shrank from about $0.32$ to about $0.03$: roughly a twelfth of what it was.", "focus_point": true}, {"at_progress": 0.5, "text": "Sweep three lands at $(1.184, 1.272)$ — another twelfth closer again, the exact same shrink as last time.", "focus_point": true}, {"at_progress": 0.65, "text": "That exact twelfth every sweep is $1/12$ — an eigenvalue of Gauss-Seidel's own update rule for this system, not a coincidence of the starting numbers chosen here."}, {"at_progress": 0.85, "text": "Diagonal dominance guaranteed this sweep converges — but it isn't the only guarantee available.", "trap": {"text": "Students think diagonal dominance is the only condition that can guarantee Gauss-Seidel converges.", "avoid": "A symmetric positive-definite matrix guarantees convergence too, even without diagonal dominance — this system's own matrix happens to be both."}}, {"at_progress": 1.0, "text": "By sweep four the point sits at $(1.182, 1.273)$ — indistinguishable at this precision from the exact answer $(13/11, 14/11)$.", "focus_point": true}]}
```
