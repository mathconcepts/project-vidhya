---
id: matrix-inverse.mnemonic
concept_id: matrix-inverse
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**Socks and shoes.** Put socks on first, then shoes. To undo it, take the *shoes* off first:

$$(AB)^{-1} = B^{-1}A^{-1}$$

Undoing a composition reverses the order — the same picture covers transpose, $(AB)^T = B^TA^T$, and powers, $(A^k)^{-1} = (A^{-1})^k$. One image, three identities.

**The $2\times2$ formula, as "Swap, Sign, Split":**

- **Swap** the diagonal entries ($a \leftrightarrow d$)
- **Sign**-flip the off-diagonal ones ($b, c \to -b, -c$)
- **Split** by the determinant

$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{ad-bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$$

Swap the *main* diagonal, negate the *other* one — never both, never neither.

**Sanity-check reflex:** multiply one row of $A$ into the matching column of your $A^{-1}$. It must equal exactly 1. That single dot product costs three seconds and catches a dropped minus sign before it costs the mark.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Swap, sign, split — build A⁻¹ live from a, b, c, d","why":"Drag any entry of a 2x2 matrix and watch A inverse update: the diagonal swaps, the off-diagonal entries flip sign, and everything divides by det(A).","inputs":[{"id":"a","label":"a","min":1,"max":9,"step":1,"initial":4},{"id":"b","label":"b","min":-9,"max":9,"step":1,"initial":2},{"id":"c","label":"c","min":-9,"max":9,"step":1,"initial":1},{"id":"d","label":"d","min":1,"max":9,"step":1,"initial":3}],"outputs":[{"label":"det(A) = ad - bc","formula":"a*d - b*c","digits":2},{"label":"(A^-1)_11 = d / det","formula":"d/(a*d-b*c)","digits":3},{"label":"(A^-1)_12 = -b / det","formula":"-b/(a*d-b*c)","digits":3},{"label":"(A^-1)_21 = -c / det","formula":"-c/(a*d-b*c)","digits":3},{"label":"(A^-1)_22 = a / det","formula":"a/(a*d-b*c)","digits":3}],"caption":"Watch a and d swap places, b and c flip sign, and the whole thing divide by det(A) — Swap, Sign, Split, every time."}
```
