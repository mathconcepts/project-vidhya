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

**Beyond $2\times2$, stop expanding and start reducing.** Row-reduce the matrix to triangular form — that just means using row operations until every entry below the main diagonal is zero. Then multiply the diagonal. Three rules, remembered as **SWAP–SCALE–ADD**:

- **SWAP** two rows → determinant **flips sign**
- **SCALE** a row by $k$ → determinant **multiplies by $k$**
- **ADD** a multiple of one row to another → determinant **unchanged** (free — use this relentlessly to manufacture zeros)

Then: for any triangular matrix, $\det =$ product of the diagonal entries.

**What the number means:** $\det$ tells you how much the matrix scales area (or volume, for bigger matrices), with a sign attached. $|\det|=3$ means areas triple; a negative sign means the shape got flipped over, like a mirror image, not just rotated; $\det=0$ means the columns got squashed flat into a smaller dimension, with no area left at all.

**Do not extend Sarrus.** The criss-cross diagonal trick works for $3\times3$ and is **wrong** for $4\times4$ and up — a $4\times4$ has $24$ terms, not $8$. Row-reduce instead.
