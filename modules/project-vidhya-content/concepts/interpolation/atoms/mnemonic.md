---
id: interpolation.mnemonic
concept_id: interpolation
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**The home-away rule.** Each Lagrange basis piece $L_i(x)$ scores a $1$ at "home" (its own node $x_i$) and a flat $0$ everywhere "away" (every other node) — that's the entire personality of a basis polynomial, and it's why summing $y_i\cdot L_i(x)$ reproduces every data point exactly.

**Worked check:** for nodes $x=1,2,3$, $L_1(1)=1$ and $L_1(2)=L_1(3)=0$ by construction — no arithmetic needed, just the definition. At any *other* $x$, though, the three $L_i$ values still add to exactly $1$.

**Sanity-check reflex:** before trusting a computed interpolated value, add up the basis values you found — $L_0+L_1+\dots+L_n$ must equal $1$ at whatever point you evaluated. If it doesn't, a sign or denominator slipped somewhere upstream.
