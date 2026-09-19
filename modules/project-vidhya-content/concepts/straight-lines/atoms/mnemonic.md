---
id: straight-lines.mnemonic
concept_id: straight-lines
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**$\Delta$ is a determinant, not a formula to memorise.** Write the general pair's coefficients into a symmetric $3\times3$ grid — $x^2$-coefficient, half the $xy$-coefficient, half the $x$-coefficient in the first row; and so on:

$$M=\begin{pmatrix}a & h & g\\ h & b & f\\ g & f & c\end{pmatrix}$$

Then $\Delta=\det(M)=abc+2fgh-af^2-bg^2-ch^2$ — exactly, term for term. Once you see the grid, there is nothing left to memorise: it is the same determinant you already know how to expand.

**For a pair through the origin**, $ax^2+2hxy+by^2=0$, only the top-left $2\times2$ corner of that grid matters: $\begin{pmatrix}a&h\\h&b\end{pmatrix}$, and $\Delta$ is automatically $0$ — a homogeneous equation is always some pair of lines (real or imaginary) through the origin, with nothing extra to check.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag a, h, b — watch the pair of lines through the origin reshape","why":"Δ for the general pair is exactly the determinant of the matrix built from a, h, g, b, f, c — no separate formula to memorise once you see it that way.","inputs":[{"id":"a","label":"a","min":0,"max":4,"step":0.5,"initial":2},{"id":"h","label":"h","min":0,"max":4,"step":0.5,"initial":3},{"id":"b","label":"b","min":-3,"max":4,"step":0.5,"initial":1}],"outputs":[{"label":"h² − ab (real, distinct lines when positive)","formula":"h^2 - a*b","digits":2},{"label":"tan(angle between the two lines)","formula":"2*sqrt(max(h^2-a*b,0))/abs(a+b)","digits":3},{"label":"a + b (perpendicular lines when this is 0)","formula":"a+b","digits":2}],"caption":"Start at a=2, h=3, b=1: h²−ab=7>0 (two real lines), tanθ=2√7/3≈1.76 (θ≈60.4°), a+b=3 (not perpendicular). Drag b down to −2 and a+b hits 0 — the pair snaps to perpendicular exactly then."}
```
