---
id: change-of-basis.mnemonic
concept_id: change-of-basis
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Columns are the new coat, standard is bare skin."** Build $P_{B\to E}$ by putting $B$'s vectors — the "new coat" — as columns, written in plain standard ("bare skin") coordinates. $P$ dresses a $B$-coordinate vector in standard clothes: $[x]_E = P[x]_B$. To undress it back to $B$-coordinates, invert: $[x]_B = P^{-1}[x]_E$.

**Worked in one line:** $B=\{(1,1),(1,-1)\}$, $[x]_B=(2,1)$. $P=\begin{pmatrix}1&1\\1&-1\end{pmatrix}$, so $[x]_E = P(2,1)^T = (3,1)$.

**Sanity-check reflex:** whichever direction you converted, reconstruct $x$ as a literal linear combination of the *other* basis and confirm it matches. If $[x]_E=(3,1)$ came from $[x]_B=(2,1)$, check $2v_1+1v_2$ by hand — it should land exactly on $(3,1)$, no rounding needed.
