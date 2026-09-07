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

- **A**lgebraic **M**ultiplicity: how many times $\lambda$ shows up as a root of the characteristic polynomial (the equation $\det(A-\lambda I)=0$ you solve to find eigenvalues in the first place)
- **G**eometric **M**ultiplicity: how many independent eigenvectors that same $\lambda$ actually hands you — written $\dim\ker(A - \lambda I)$, which just means "how many independent solutions does $(A-\lambda I)v=0$ have"

$\text{AM} \geq \text{GM}$ always holds, and

$$A \text{ is diagonalizable} \iff \text{AM} = \text{GM} \text{ for every eigenvalue}$$

Diagonalizable is exactly the case where the two numbers match, for every eigenvalue. Nothing else to memorise about the condition.

**"$P$ holds the vectors, $D$ holds the values — same order."** Column $i$ of $P$ is the eigenvector that goes with entry $(i,i)$ of $D$. Move one, and you must move the other to match.

**Read $A = PDP^{-1}$ right to left:** $P^{-1}$ switches you into eigen-coordinates (the axes lined up with the eigenvectors), $D$ scales each of those axes on its own, and $P$ switches you back. That is also why $A^k = PD^kP^{-1}$ — the middle $P^{-1}P$ pairs cancel out, and all that survives is scaling $k$ times.

**Two shortcuts worth spotting instantly:** $n$ **distinct** eigenvalues means $A$ is automatically diagonalizable (every AM is 1, so it's forced to match its GM). A real **symmetric** matrix is always diagonalizable too, and in a tidy way — its eigenvectors come out at right angles to each other. Both are shortcuts, not requirements — the identity matrix $I_n$ repeats the same eigenvalue $n$ times and is already diagonal.
