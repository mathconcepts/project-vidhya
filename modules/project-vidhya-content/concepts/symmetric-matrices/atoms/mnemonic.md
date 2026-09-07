---
id: symmetric-matrices.mnemonic
concept_id: symmetric-matrices
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**The diagonal is a mirror.** Fold the matrix along the main diagonal (the line of entries from top-left to bottom-right); if every entry lands exactly on its twin, $A = A^T$. That's the whole test, and it's a *visual* one — you can check a $4\times4$ matrix by eye in seconds, no need to actually write $A^T$ out.

**The counting consequence, worth memorising:** because the upper triangle (the entries above the diagonal) fully determines the lower one, a symmetric $n\times n$ matrix only really has

$$\frac{n(n+1)}{2} \text{ independent entries}$$

(the $n$ diagonal entries, plus the $\tfrac{n(n-1)}{2}$ entries above the diagonal — the ones below just copy them). That number tells you how many truly different symmetric matrices of this size exist — GATE asks for it directly, so keep it handy. Its partner: skew-symmetric matrices (where $A = -A^T$ instead) only have $\frac{n(n-1)}{2}$, because the mirror rule forces every diagonal entry to equal its own negative, so $a_{ii} = -a_{ii} = 0$ and the whole diagonal is wiped out. For $n=3$: $6$ and $3$, which add up to $9 = 3^2$, the total number of entries in a $3\times3$ matrix — every square matrix splits neatly into a symmetric piece and a skew piece, $A = \underbrace{\tfrac{A+A^T}{2}}_{\text{symmetric}} + \underbrace{\tfrac{A-A^T}{2}}_{\text{skew}}$.

**The guarantee to attach to the word "symmetric":** *real eigenvalues (never complex numbers), perpendicular eigenvectors (the technical word is "orthogonal"), and always diagonalizable* (meaning: it can always be broken down cleanly into its eigenvector directions, with nothing left over). Not "usually" — always, even when an eigenvalue repeats. Seeing $A = A^T$ in a question stem means you have already been handed that whole conclusion for free.
