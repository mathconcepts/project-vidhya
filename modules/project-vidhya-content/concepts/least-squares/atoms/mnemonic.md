---
id: least-squares.mnemonic
concept_id: least-squares
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
modality: mnemonic
exam_ids: ["*"]
---

**"Normal" in "normal equations" means perpendicular, not ordinary.** That one word is the whole derivation. The best $\hat{x}$ is the one whose residual $r = b - A\hat{x}$ is perpendicular to every column of $A$:

$$A^T(b - A\hat{x}) = 0 \quad \Longrightarrow \quad A^TA\hat{x} = A^Tb$$

So you never memorise the normal equations — you write "residual $\perp$ columns," multiply out, and they fall out in one line.

**The one-move recipe: hit both sides with $A^T$.** $Ax = b$ has no solution. $A^TAx = A^Tb$ does. Squaring up the tall matrix is the entire method.

**The projection twin.** $A\hat{x} = Pb$ where $P = A(A^TA)^{-1}A^T$ is the hat matrix. Two properties are worth remembering because they're free marks: $P^2 = P$ (projecting a shadow again doesn't move it) and $P^T = P$.

**Sanity-check reflex:** after solving, compute $A^Tr$. It must be the zero vector — every entry, not just the first. If it isn't, the arithmetic slipped, and it slipped before you formed $A^Tb$.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag a and b — watch the residual stay perpendicular to the column",
  "why": "Fit a scalar x-hat to one column a via least squares, then check the leftover error r = b − x-hat·a — drag a and b and a·r keeps landing on zero, exactly as the normal equations demand.",
  "inputs": [
    {"id": "a1", "label": "a (1)", "min": 0.5, "max": 3, "step": 0.5, "initial": 2},
    {"id": "a2", "label": "a (2)", "min": 0.5, "max": 3, "step": 0.5, "initial": 1},
    {"id": "b1", "label": "b (1)", "min": -3, "max": 3, "step": 0.5, "initial": 3},
    {"id": "b2", "label": "b (2)", "min": -3, "max": 3, "step": 0.5, "initial": 1}
  ],
  "outputs": [
    {"label": "x̂ = (a·b)/(a·a)", "formula": "(a1*b1 + a2*b2) / (a1^2 + a2^2)", "digits": 3},
    {"label": "r1 = b1 − x̂·a1", "formula": "b1 - ((a1*b1 + a2*b2) / (a1^2 + a2^2)) * a1", "digits": 3},
    {"label": "r2 = b2 − x̂·a2", "formula": "b2 - ((a1*b1 + a2*b2) / (a1^2 + a2^2)) * a2", "digits": 3},
    {"label": "check: a·r (should be 0)", "formula": "a1 * (b1 - ((a1*b1 + a2*b2) / (a1^2 + a2^2)) * a1) + a2 * (b2 - ((a1*b1 + a2*b2) / (a1^2 + a2^2)) * a2)", "digits": 4}
  ],
  "caption": "This is the one-column case of A^T(b−Ax̂)=0. Drag a=(a1,a2) and b=(b1,b2) — a·r always reads 0.0000, exactly the sanity-check reflex from the mnemonic."
}
```
