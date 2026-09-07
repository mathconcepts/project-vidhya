---
id: lu-factorization.mnemonic
concept_id: lu-factorization
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
modality: mnemonic
exam_ids: ["*"]
---

**"L keeps the Leftovers."** You do no new work building $L$ — you just write down the steps you already used to clear out $A$. Whenever you clear a number below the diagonal by subtracting a multiple of one row from another (this row-by-row clearing process is called **elimination**), that multiplier — the number you scaled the row by — goes straight into $L$ at the matching slot $\ell_{ij}$, no sign flip. $U$ is whatever is left standing once the clearing is done; $L$ is the receipt for how it got cleared.

**Where each letter sits:** $L$ owns the **l**ower-left slots (the multipliers), $U$ owns the **u**pper-right slots (the survivors). In **Doolittle form** — one of the two standard ways to split $A$ into $L$ and $U$ — $L$'s diagonal is fixed at 1, so you never have to solve for it.

**Worked micro-check:** for $A=\begin{pmatrix}2&1\\6&8\end{pmatrix}$, the **determinant** (a single number — here $2\cdot8-1\cdot6=10$ — that captures how the matrix scales area) is $10$. Since $L$'s diagonal is all 1s, its determinant is 1, so $U$'s determinant must also come out to 10 — and indeed $u_{11}u_{22}=2\cdot5=10$, matching the micro-exercise above.

**Sanity-check reflex:** multiply $L$ and $U$ back together and check the result against $A$'s first row and first column — cheapest to verify, and they catch nearly every arithmetic slip.
