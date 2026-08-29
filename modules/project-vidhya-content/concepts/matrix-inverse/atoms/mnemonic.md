---
id: matrix-inverse.mnemonic
concept_id: matrix-inverse
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**Socks and shoes.** You put socks on first, then shoes. To undo it you take the *shoes* off first:

$$(AB)^{-1} = B^{-1}A^{-1}$$

Undoing a composition reverses the order. The same picture covers the transpose, $(AB)^T = B^TA^T$, and powers, $(A^k)^{-1} = (A^{-1})^k$. One image, three identities.

**The 2×2 formula, as "Swap, Sign, Split":**

- **Swap** the diagonal entries ($a \leftrightarrow d$)
- **Sign**-flip the off-diagonal ones ($b, c \to -b, -c$)
- **Split** by the determinant

$$
\begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{ad-bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}
$$

Swap the *main* diagonal, negate the *other* one — never both, never neither.

**Sanity-check reflex:** multiply one row of $A$ into the matching column of your $A^{-1}$. It must come out to exactly 1. That single dot product costs three seconds and catches a dropped minus sign before it costs you the mark.
