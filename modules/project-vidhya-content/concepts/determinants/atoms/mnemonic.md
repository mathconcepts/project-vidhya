---
id: determinants.mnemonic
concept_id: determinants
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**$2\times2$: main diagonal minus anti-diagonal.** $\det\begin{pmatrix} a & b \\ c & d\end{pmatrix} = ad - bc$. Down-right first, up-right second, subtract.

**Beyond $2\times2$, stop expanding and start reducing.** Row-reduce to triangular form, then multiply the diagonal. Three rules, remembered as **SWAP–SCALE–ADD**:

- **SWAP** two rows → determinant **flips sign**
- **SCALE** a row by $k$ → determinant **multiplies by $k$**
- **ADD** a multiple of one row to another → determinant **unchanged** (free — use this one relentlessly to manufacture zeros)

Then: for any triangular matrix, $\det = $ product of the diagonal entries. Nothing else to compute.

**What the number means:** $\det$ is the signed volume scale factor. $|\det| = 3$ means volumes triple; a negative sign means orientation flipped (a reflection); $\det = 0$ means the columns collapsed into a lower dimension — which is exactly why $\det = 0 \iff$ singular.

**Do not extend Sarrus.** The criss-cross diagonal trick works for $3\times3$ and is **wrong** for $4\times4$ and up. A $4\times4$ has 24 terms, not 8. Row-reduce instead — it is the only method whose cost stays sane as $n$ grows.
