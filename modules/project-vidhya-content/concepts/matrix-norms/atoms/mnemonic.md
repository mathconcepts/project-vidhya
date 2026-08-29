---
id: matrix-norms.mnemonic
concept_id: matrix-norms
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**Read the subscript as a picture.** The single hardest thing here is remembering which of $\|A\|_1$ and $\|A\|_\infty$ sums columns and which sums rows. The symbols tell you:

- **"1" is a vertical stroke** → sum *down* the **columns**, take the max. $\|A\|_1 = \max_j \sum_i |a_{ij}|$
- **"$\infty$" is a horizontal figure** → sum *across* the **rows**, take the max. $\|A\|_\infty = \max_i \sum_j |a_{ij}|$

One is tall, one is wide. That's the whole rule, and it never leaves once you've seen it.

**The other two, by cost:**

- $\|A\|_F$ — flatten the matrix into one long vector and take its length. Cheapest of all four.
- $\|A\|_2 = \sigma_{\max}(A)$ — the only expensive one, because it needs the eigenvalues of $A^TA$.

**Sanity-check reflex:** every induced norm dominates the spectral radius, $\rho(A) \le \|A\|$. So compute the max row sum in five seconds and use it as a ceiling: if your $\|A\|_2$ came out *larger* than $\|A\|_\infty$ or $\|A\|_F$, you have made an arithmetic error, because $\|A\|_2 \le \|A\|_F$ always holds.
