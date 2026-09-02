---
id: taylor-laurent.mnemonic
concept_id: taylor-laurent
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Count the basement floors."** Picture the principal part as floors below ground level ($z^{-1}, z^{-2},\ldots$). No basement: removable. A finite basement, $m$ floors deep: pole of order $m$. A basement with no bottom: essential.

**Worked micro-example.** $f(z)=\dfrac{\sin z}{z^3}$ at $z=0$: $\sin z=z-\frac{z^3}{6}+\cdots$, so $f(z)=\frac1{z^2}-\frac16+\frac{z^2}{120}-\cdots$ — one basement floor, $z^{-2}$, none deeper. Pole of order $2$, not order $3$ (the numerator's own zero at $z=0$ cancels one floor).

**Sanity-check reflex.** Always cancel common factors between numerator and denominator *before* counting floors — an uncancelled zero in the numerator can make a pole look one order deeper than it actually is.
