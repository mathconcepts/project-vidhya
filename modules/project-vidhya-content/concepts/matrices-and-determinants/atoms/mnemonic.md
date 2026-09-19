---
id: matrices-and-determinants.mnemonic
concept_id: matrices-and-determinants
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"Swap, Sign, Split" for the $2\times2$ inverse.** For $A=\begin{pmatrix}a&b\\c&d\end{pmatrix}$: **swap** $a$ and $d$, flip the **sign** of $b$ and $c$, then **split** (divide) the whole result by $\det(A)$:

$$A^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$$

**"Only one operation is free."** Of the three row operations, only "add a multiple of one row to another" leaves the determinant untouched — think of it as the only move you can make for free, as many times as you like, while row-reducing. The other two (swap, scale) both cost you something: a sign flip, or a scaling factor.

**Drag the entries below and watch the same shortcut rebuild the inverse every time — never just one fixed example.**

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag A's entries — watch det(A) and A inverse update together",
  "why": "Swap, sign-flip, divide by det(A) — drag any entry and watch the inverse rebuild from that same three-step rule, not only for one fixed matrix.",
  "inputs": [
    {"id": "a", "label": "a (top-left)", "min": 1, "max": 5, "step": 1, "initial": 3},
    {"id": "b", "label": "b (top-right)", "min": 0, "max": 4, "step": 1, "initial": 2},
    {"id": "c", "label": "c (bottom-left)", "min": 0, "max": 5, "step": 1, "initial": 5},
    {"id": "d", "label": "d (bottom-right)", "min": 1, "max": 5, "step": 1, "initial": 4}
  ],
  "outputs": [
    {"label": "det(A) = ad - bc", "formula": "a*d - b*c", "digits": 2},
    {"label": "A inverse entry (1,1) = d/det", "formula": "d / (a*d - b*c)", "digits": 2},
    {"label": "A inverse entry (1,2) = -b/det", "formula": "(0 - b) / (a*d - b*c)", "digits": 2},
    {"label": "A inverse entry (2,1) = -c/det", "formula": "(0 - c) / (a*d - b*c)", "digits": 2},
    {"label": "A inverse entry (2,2) = a/det", "formula": "a / (a*d - b*c)", "digits": 2}
  ],
  "caption": "Start at a=3, b=2, c=5, d=4 — the cipher-encoding matrix from the hook. Check det(A)=2, and the inverse entries read 2, -1, -2.5, 1.5. Now drag any entry toward making ad equal bc — watch det(A) approach zero and the inverse entries blow up, since you are dividing by a number shrinking toward zero."
}
```
