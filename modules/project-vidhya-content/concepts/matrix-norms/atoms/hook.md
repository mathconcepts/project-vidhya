---
id: matrix-norms.hook
concept_id: matrix-norms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Two invertible matrices, both perfectly reasonable on paper. Solve $Ax=b$ with one, nudge $b$ by $0.1\%$, and the answer moves by about $0.1\%$ too. Solve with the other, nudge $b$ by that same tiny amount, and the answer swings by $500\%$.

Nothing about either matrix's entries looks alarming — no huge numbers, no obvious near-singularity. What single number, computable before you solve anything, would have warned you which matrix was the dangerous one? It comes from how far a matrix stretches its *most* stretched direction against its *least* stretched one.
