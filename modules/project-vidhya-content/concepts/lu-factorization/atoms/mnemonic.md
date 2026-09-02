---
id: lu-factorization.mnemonic
concept_id: lu-factorization
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
modality: mnemonic
exam_ids: ["*"]
---

**"L keeps the Leftovers."** You do no new work building $L$ — you write down the elimination you already performed. Every time a row operation $R_i \leftarrow R_i - m\,R_j$ clears an entry, the multiplier $m$ goes straight into slot $\ell_{ij}$, no sign flip. $U$ is what's left standing after the clearing; $L$ is the receipt for how it got cleared.

**Where each letter sits:** $L$ owns **l**ower-left (the multipliers), $U$ owns **u**pper-right (the survivors). In Doolittle form $L$'s diagonal is fixed at 1 — free real estate, never a multiplier.

**Worked micro-check:** for $A=\begin{pmatrix}2&1\\6&8\end{pmatrix}$, $\det A = 2\cdot8-1\cdot6=10$. Since $\det L=1$, $\det U$ must equal 10 too — and indeed $u_{11}u_{22}=2\cdot5=10$ from the micro-exercise above.

**Sanity-check reflex:** multiply $L$ and $U$ back together and check the result against $A$'s first row and first column — cheapest to verify, and they catch nearly every arithmetic slip.
