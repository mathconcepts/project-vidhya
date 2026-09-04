---
# Alternative body for systems-of-equations.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: systems-of-equations.intuition.assured
concept_id: systems-of-equations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: systems-of-equations.intuition
for_stance: assured
---

$A\mathbf{x}=\mathbf{b}$ is consistent iff $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])$ (Rouché–Capelli) — watched below on the hook's own full-rank $A$, where that condition holds for every $\mathbf{b}$ at once.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "The hook's own family — read through rank, not just the picture", "why": "The augmented matrix can't outrank A once A's own columns already span the plane — watch consistency get decided before b is even chosen.", "x_expr": "(3+t)/2", "y_expr": "(3-t)/2", "t_min": -3, "t_max": 3, "duration_sec": 8, "view_box": {"x_min": -0.5, "x_max": 3.5, "y_min": -0.5, "y_max": 3.5}, "narration_steps": [{"at_progress": 0, "text": "The hook's own $t=0$ case: $x+y=3,\\ x-y=0$, matrix form $A=\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}$, $\\mathbf b=\\begin{pmatrix}3\\\\0\\end{pmatrix}$. Guess: does the augmented matrix $[A\\mid\\mathbf b]$ carry any MORE information than $A$ alone?", "text_shaken": "At $t=0$ (the hook's own case): $A=\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}$, $\\mathbf b=\\begin{pmatrix}3\\\\0\\end{pmatrix}$. Guess first: does adding column $\\mathbf b$ to $A$ change how much information the matrix carries?", "text_assured": "At the hook's $t=0$: $A=\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}$, $\\mathbf b=\\begin{pmatrix}3\\\\0\\end{pmatrix}$. Before checking Rouché–Capelli directly — can $\\mathrm{rank}([A\\mid\\mathbf b])$ ever exceed $\\mathrm{rank}(A)$ here?", "emphasize": false}, {"at_progress": 0.3, "text": "No — $\\mathrm{rank}(A)=2$ already ($\\det A=-2\\neq0$), and $A$'s two columns already span the whole plane. Any $\\mathbf b$ lands inside that span, so $\\mathrm{rank}([A\\mid\\mathbf b])=2=\\mathrm{rank}(A)$: Rouché–Capelli's condition, satisfied by construction.", "text_shaken": "No new information: $\\mathrm{rank}(A)=2$ already, since $\\det A=-2\\neq0$. $A$'s columns already reach every point in the plane, so any $\\mathbf b$ fits inside — $\\mathrm{rank}([A\\mid\\mathbf b])=2$ too.", "text_assured": "Confirmed: $\\mathrm{rank}(A)=2$, full row rank, so its column space is already all of $\\mathbb R^2$ — no $\\mathbf b$ can push $\\mathrm{rank}([A\\mid\\mathbf b])$ past $2$. Rouché–Capelli's consistency condition holds for every $\\mathbf b$ simultaneously.", "emphasize": true}, {"at_progress": 0.55, "text": "That shared rank, $2$, also equals $n=2$ (the number of unknowns) — so this isn't just consistent, it's UNIQUELY solvable: $n-\\mathrm{rank}(A)=0$ free variables, for every value of $t$ at once.", "text_shaken": "That rank, $2$, equals $n=2$, the number of unknowns. So it's not just consistent — exactly one solution, always: $n-\\mathrm{rank}(A)=0$ free variables, whatever $t$ is.", "text_assured": "$\\mathrm{rank}(A)=n=2$ upgrades \\\"consistent\\\" to \\\"uniquely solvable\\\": $n-\\mathrm{rank}(A)=0$ free variables for every $\\mathbf b$, which is exactly why the solution traces a single path instead of jumping between one-solution and no-solution cases.", "emphasize": false, "trap": {"text": "Students recompute rank(A) fresh every time they try a new value of t, as if the coefficient matrix itself might change.", "avoid": "Only b changes with t here; A stays fixed at (1,1;1,-1) throughout — check rank(A) once, never once per t."}}, {"at_progress": 0.85, "text": "Nothing about $t$ ever touches $A$ — only $\\mathbf b$ moves. That is the entire reason the crossing point keeps existing for every $t$: the rank story was decided the moment $A$ was written down.", "text_shaken": "Only $\\mathbf b$ changes with $t$; $A$ never does. That's why a solution always exists — the rank story was already settled the moment $A$ was written down.", "text_assured": "$t$ only ever perturbs $\\mathbf b$; $A$'s rank is fixed the instant $A$ is written. That decoupling is the general reason a full-rank coefficient matrix guarantees a unique solution independent of the right-hand side chosen.", "emphasize": false}]}
```

Given consistency, compare that common rank to $n$: equal gives a unique solution, less gives an $(n-\text{rank})$-parameter family. Row reduction dominates in practice — $O(n^3)$, and hands you the rank as a byproduct; Cramer's rule scales as $O(n!)$, recognize it past $n=3$ rather than reach for it.

Fast path on MCQs: if a question only asks "how many solutions," row-reduce to echelon form and read off both ranks — skip back-substitution entirely.
