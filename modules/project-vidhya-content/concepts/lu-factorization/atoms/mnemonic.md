---
id: lu-factorization.mnemonic
concept_id: lu-factorization
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"$L$ = Left-over multipliers."** You are not doing new work to build $L$ — you are *writing down the elimination you already did*. Every time you clear an entry with $R_i \leftarrow R_i - m\,R_j$, the multiplier $m$ goes straight into slot $\ell_{ij}$. No sign flip. The elimination writes its own history into $L$; $U$ is just the wreckage it leaves behind.

**Which letter sits where:** $L$ points **L**eft-and-down (the multipliers live *below* the diagonal), $U$ points **U**p-and-right. And in Doolittle form $L$ wears a **unit** diagonal — all 1s.

**The one shortcut worth memorising:**

$$\det L = 1 \quad \Rightarrow \quad \det A = \det U = u_{11}u_{22}\cdots u_{nn}$$

Once you have $U$, the determinant is a product of $n$ numbers you can read off the diagonal — no cofactor expansion, ever.

**Sanity-check reflex:** multiply your $L$ and $U$ back together and check the *first column* and *first row* against $A$. Those two are cheapest to check and catch most arithmetic slips immediately.
