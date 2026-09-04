---
# Alternative body for spectral-theorem.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
id: spectral-theorem.intuition.shaken
concept_id: spectral-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: spectral-theorem.intuition
for_stance: shaken
---

$A=\begin{pmatrix}2&2\\2&-1\end{pmatrix}$ from the hook is symmetric. Its two directions, $(2,1)$ and $(1,-2)$, turn out perpendicular. Watch it confirmed below.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "The hook's directions, checked for a right angle", "why": "The right angle isn't luck — it's guaranteed by A=Aᵀ, and it's the whole reason Q⁻¹=Qᵀ costs nothing to compute.", "duration_sec": 8, "linear_map": {"matrix": [[2, 2], [2, -1]], "num_vectors": 16, "eigen": [{"dir": [2, 1], "value": 3}, {"dir": [1, -2], "value": -2}]}, "narration_steps": [{"at_progress": 0, "focus_eigen": [0, 1], "text": "The hook's two eigen-directions on $A=\\begin{pmatrix}2&2\\\\2&-1\\end{pmatrix}$ were $(2,1)$ and $(1,-2)$. Take their dot product: $(2)(1)+(1)(-2)$. Guess: does it come out zero — a genuine right angle?", "text_shaken": "Hook's two directions on $A=\\begin{pmatrix}2&2\\\\2&-1\\end{pmatrix}$: $(2,1)$ and $(1,-2)$. Dot product: $(2)(1)+(1)(-2)$. Guess first — does this come out to zero?", "text_assured": "$(2,1)\\cdot(1,-2)=(2)(1)+(1)(-2)$ on the hook's own $A$. Before confirming: is this right angle a coincidence of this matrix, or guaranteed by $A=A^T$ alone?", "emphasize": false}, {"at_progress": 0.3, "focus_eigen": [0, 1], "text": "Exactly $0$ — a genuine right angle, guaranteed because $A=A^T$. Scale each to unit length as columns of $Q=\\tfrac{1}{\\sqrt5}\\begin{pmatrix}2&1\\\\1&-2\\end{pmatrix}$; then $Q^TQ=I$.", "text_shaken": "Zero — a right angle, always true when $A=A^T$. Shrink each vector to length $1$: $Q=\\tfrac{1}{\\sqrt5}\\begin{pmatrix}2&1\\\\1&-2\\end{pmatrix}$. Then $Q^TQ=I$.", "text_assured": "Confirmed: $0$, a right angle guaranteed by $A=A^T$ alone, not this matrix's luck. Normalized, $Q=\\tfrac{1}{\\sqrt5}\\begin{pmatrix}2&1\\\\1&-2\\end{pmatrix}$ satisfies $Q^TQ=I$ exactly.", "emphasize": true}, {"at_progress": 0.55, "text": "Because $Q^TQ=I$, $Q^{-1}=Q^T$ for free — no separate inverse to compute. Put $3,-2$ on $\\Lambda$'s diagonal, same order as the columns, and $A=Q\\Lambda Q^T$ rotates in and back at zero extra cost.", "text_shaken": "$Q^TQ=I$ means $Q^{-1}=Q^T$ — no inverse to compute separately. Put $3,-2$ on $\\Lambda$'s diagonal, matching column order, and $A=Q\\Lambda Q^T$.", "text_assured": "$Q^TQ=I\\Rightarrow Q^{-1}=Q^T$, the entire payoff of orthogonality: rotating back costs nothing beyond a transpose. $\\Lambda=\\mathrm{diag}(3,-2)$, matched to $Q$'s column order, gives $A=Q\\Lambda Q^T$.", "emphasize": false, "trap": {"text": "Students use the eigenvectors $(2,1)$ and $(1,-2)$ directly as Q's columns without shrinking them to length 1 first.", "avoid": "Divide every eigenvector by its own length before it becomes a column of Q — only unit-length columns make $Q^TQ=I$ and $Q^{-1}=Q^T$."}}, {"at_progress": 0.85, "text": "Skip the normalizing and $Q^TQ=5I$ instead of $I$ — $Q^{-1}$ is then $Q^T/5$, not $Q^T$ alone, and the whole shortcut this theorem buys is lost.", "text_shaken": "Without normalizing, $Q^TQ=5I$, not $I$. $Q^{-1}$ becomes $Q^T/5$ — the free-inverse trick only works with unit-length columns.", "text_assured": "Skip normalizing and $Q^TQ=5I$: $Q^{-1}=Q^T/5$, not $Q^T$ — the entire computational advantage of orthogonal diagonalization depends on that one normalizing step.", "emphasize": false}]}
```

Face along those two directions instead of the usual $x,y$ axes. From there $A$ just stretches: by $3$ along $(2,1)$, by $-2$ along $(1,-2)$. No mixing.
