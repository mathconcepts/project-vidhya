---
id: symmetric-matrices.mnemonic
concept_id: symmetric-matrices
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**The diagonal is a mirror.** Fold the matrix along the main diagonal; if every entry lands on its twin, $A = A^T$. That's the whole test, and it's a *visual* one — you can check a $4\times4$ by eye in seconds without writing $A^T$ out.

**The counting consequence, worth memorising:** because the upper triangle determines the lower one, a symmetric $n\times n$ matrix carries only

$$\frac{n(n+1)}{2} \text{ independent entries}$$

(the $n$ diagonal entries plus the $\tfrac{n(n-1)}{2}$ above it). That number *is* the dimension of the space of symmetric matrices — GATE asks for it directly. Its partner: skew-symmetric matrices have $\frac{n(n-1)}{2}$, because the mirror forces $a_{ii} = -a_{ii} = 0$ and the diagonal is dead. For $n=3$: $6$ and $3$, which sum to $9 = 3^2$ — every matrix splits as $A = \underbrace{\tfrac{A+A^T}{2}}_{\text{symmetric}} + \underbrace{\tfrac{A-A^T}{2}}_{\text{skew}}$.

**The guarantee to attach to the word "symmetric":** *real eigenvalues, orthogonal eigenvectors, always diagonalizable.* Not "usually" — always, repeated eigenvalues included. Seeing $A = A^T$ in a question stem means you have already been handed that conclusion for free.
