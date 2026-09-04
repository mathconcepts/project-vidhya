---
# Alternative body for diagonalization-intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: diagonalization.intuition.assured
concept_id: diagonalization
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: diagonalization-intuition
for_stance: assured
---

$A=PDP^{-1}$ below is a genuine change of basis, not a trick — watch it hold on the hook's own $P,D$ before trusting it in general.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "The hook's own two rails, now read as P and D", "why": "Diagonalization just renames the hook's own two rails as new axes — watch the same numbers become the substitution $A=PDP^{-1}$.", "duration_sec": 8, "linear_map": {"matrix": [[4, 1], [2, 3]], "num_vectors": 16, "eigen": [{"dir": [1, 1], "value": 5}, {"dir": [1, -2], "value": 2}]}, "narration_steps": [{"at_progress": 0, "focus_eigen": [0, 1], "text": "The hook found two rails on $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$: $(1,1)$ stretched by $5$, $(1,-2)$ stretched by $2$. Stack those as columns of $P=\\begin{pmatrix}1&1\\\\1&-2\\end{pmatrix}$, put $5,2$ on a diagonal $D$, same order. Guess: does $PDP^{-1}$ hand back $A$?", "text_shaken": "Same two rails as the hook: $(1,1)\\to5$, $(1,-2)\\to2$. Write $P=\\begin{pmatrix}1&1\\\\1&-2\\end{pmatrix}$ (the two rails as columns) and $D=\\begin{pmatrix}5&0\\\\0&2\\end{pmatrix}$ (the two numbers on a diagonal). Guess first: multiply $PDP^{-1}$ out — does it give $A$ back?", "text_assured": "$P=\\begin{pmatrix}1&1\\\\1&-2\\end{pmatrix}$, $D=\\mathrm{diag}(5,2)$ — the hook's own eigenpairs, re-packed. Before checking: is $PDP^{-1}=A$ a coincidence of this matrix, or does it hold for every diagonalizable one?", "emphasize": false}, {"at_progress": 0.35, "text": "Yes — multiply it out and $PDP^{-1}=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}=A$, exactly. $D$ is the SAME map, described using the eigen-rails as axes instead of the usual $x,y$ ones — in those axes, $A$ only scales, never mixes.", "text_shaken": "Yes: $PDP^{-1}=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}=A$, the same matrix back. $D$ is what $A$ looks like if you stand along the two rails instead of the usual $x,y$ directions — from there, it just scales.", "text_assured": "Confirmed: $PDP^{-1}=A$. $D$ is $A$'s own action, re-described in the eigenbasis — a genuine change of coordinates, not a computational trick, which is why it generalises to $A^k$, $e^{At}$, $\\sqrt A$ unchanged in form.", "emphasize": true}, {"at_progress": 0.65, "text": "Order is the whole trick: column $i$ of $P$ must match diagonal entry $i$ of $D$. Swap the diagonal to $(2,5)$ while keeping $P$'s columns as they were, and $PDP^{-1}$ turns into a different matrix altogether — not $A$.", "text_shaken": "Order matters: $P$'s first column must match $D$'s first diagonal entry. Swap $D$ to $(2,5)$ while $P$ stays $(1,1),(1,-2)$, and $PDP^{-1}$ stops being $A$ — a different matrix comes out.", "text_assured": "The one place this slips: column $i$ of $P$ must line up with diagonal entry $i$ of $D$. Swap $D$'s order alone (to $(2,5)$) and $PDP^{-1}\\neq A$ — always re-check the pairing, not just the two lists separately.", "emphasize": false, "trap": {"text": "Students find both eigenvalues and both eigenvectors correctly, then pair them up in the wrong order — writing D's diagonal as (2,5) while P's columns stay (1,1) then (1,-2).", "avoid": "Match column i of P to diagonal entry i of D — the SAME index, never just \\\"both eigenvalues, both eigenvectors\\\" listed separately."}}, {"at_progress": 0.9, "text": "That is the whole payoff: $A^{100}$ needs no repeated matrix multiplying — just $5^{100}$ and $2^{100}$ on the diagonal of $D^{100}$, translated back through the same fixed $P$.", "text_shaken": "That's the payoff: $A^{100}$ never needs 100 matrix multiplications — just $5^{100}$ and $2^{100}$ on a diagonal, then translated back through the same $P$.", "text_assured": "The payoff generalises past powers: $D$'s entries can go through ANY function applied one at a time — square root, $e^{Dt}$ — and $P(\\cdot)P^{-1}$ carries the result back, which is the entire reason diagonalization matters past this one matrix.", "emphasize": false}]}
```

The two free sufficient tests — $n$ distinct eigenvalues, or real symmetric $A$ — are not necessary. The real condition is geometric multiplicity equal to algebraic multiplicity for every eigenvalue; a repeated eigenvalue short on independent eigenvectors is *defective*, and no relabeling recovers a diagonalization.
