---
id: diagonalization.mnemonic
concept_id: diagonalization
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"AM ≥ GM"** — borrow the inequality you already know, and re-read the letters:

- **A**lgebraic **M**ultiplicity: how many times $\lambda$ is a root of the characteristic polynomial
- **G**eometric **M**ultiplicity: $\dim\ker(A - \lambda I)$, the eigenspace dimension

$\text{AM} \geq \text{GM}$ always holds, and

$$A \text{ is diagonalizable} \iff \text{AM} = \text{GM} \text{ for every eigenvalue}$$

Diagonalizability is exactly the case of **equality**. Nothing else to memorise about the condition.

**"$P$ holds the vectors, $D$ holds the values — same order."** Column $i$ of $P$ is the eigenvector belonging to entry $(i,i)$ of $D$. Shuffle one and you must shuffle the other.

**Read $A = PDP^{-1}$ right to left:** $P^{-1}$ changes into eigen-coordinates, $D$ scales each axis independently, $P$ changes back. That is also why $A^k = PD^kP^{-1}$ — the middle steps cancel in pairs, and all that survives is scaling $k$ times.

**Two freebies worth recognising instantly:** $n$ **distinct** eigenvalues $\Rightarrow$ diagonalizable (every AM is 1, so equality is forced). Real **symmetric** $\Rightarrow$ diagonalizable, and orthogonally so. Both are sufficient, neither is necessary — $I_n$ has one eigenvalue repeated $n$ times and is already diagonal.
