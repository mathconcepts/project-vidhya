---
id: jordan-normal-form.mnemonic
concept_id: jordan-normal-form
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**Jordan form is the receipt for eigenvectors you didn't get.** A matrix "wants" $n$ independent eigenvectors. Every one it comes up short by becomes a $1$ on the superdiagonal — a little arrow pointing at the eigenvector this generalized vector had to borrow. Zero shortfall, zero ones: that's just diagonalization.

**The three counts, remembered as "BAM":**

- **B**locks for $\lambda$ $=$ **geometric** multiplicity $= n - \text{rank}(A - \lambda I)$
- **A**ll block sizes for $\lambda$ **add** to the **algebraic** multiplicity
- **M**ax block size for $\lambda$ $=$ its exponent in the **minimal** polynomial

Count the blocks, fill them to the algebraic multiplicity, size the biggest from the minimal polynomial. Three facts, three questions GATE asks.

**When BAM leaves the sizes ambiguous, climb the rank ladder:**

$$\#\{\text{blocks of size} \geq k\} = \text{rank}(A - \lambda I)^{k-1} - \text{rank}(A - \lambda I)^{k}$$

**Sanity-check reflex:** the block sizes for each eigenvalue must sum to its algebraic multiplicity, and all sizes across all eigenvalues must sum to $n$. If your assembled $J$ isn't $n \times n$, you've dropped a block — go back before you trust it.
