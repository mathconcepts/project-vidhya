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

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag [x]_B and watch P dress it in standard coordinates",
  "why": "P dresses a B-coordinate vector in standard clothes — drag the two B-coordinates and watch the same fixed P turn them into standard coordinates, every time, not just for (2,1).",
  "inputs": [
    {"id": "b1", "label": "[x]_B first coordinate", "min": -3, "max": 3, "step": 0.5, "initial": 2},
    {"id": "b2", "label": "[x]_B second coordinate", "min": -3, "max": 3, "step": 0.5, "initial": 1}
  ],
  "outputs": [
    {"label": "[x]_E first coordinate = b1 + b2", "formula": "b1 + b2", "digits": 2},
    {"label": "[x]_E second coordinate = b1 - b2", "formula": "b1 - b2", "digits": 2}
  ],
  "caption": "P = [(1,1),(1,-1)] never changes. Start at (2,1) and check [x]_E comes out (3,1), matching the mnemonic's worked line — then drag to any other [x]_B and the same P still dresses it correctly."
}
```
