---
id: inverse-trigonometric.mnemonic
concept_id: inverse-trigonometric
atom_type: mnemonic
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
modality: mnemonic
---

**"Check the sign of $1-xy$ before you trust anything with $\tan^{-1}$ in it."** That single check decides which of the three formula shapes applies — you never need to memorise all three as separate facts, only this one sign check plus the sign of $x$ and $y$ themselves.

- $1-xy>0$ (that is, $xy<1$): the direct formula is correct as written. No correction needed.
- $1-xy<0$ (that is, $xy>1$) and $x,y$ both positive: add $\pi$ to the raw output.
- $1-xy<0$ and $x,y$ both negative: subtract $\pi$ from the raw output.
- $1-xy=0$ exactly: the formula is undefined (division by zero) — recognise this as $\tan^{-1}x+\tan^{-1}y=\pi/2$ directly, a separate fact, never a case of the general formula.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag x and y — watch the sign of 1-xy decide which formula case applies",
  "why": "Drag x and y and watch 1-xy change sign. When it is positive, tan^-1((x+y)/(1-xy)) is already the true sum. When it flips negative, that same raw number needs +-pi added before it matches.",
  "inputs": [
    {"id": "x", "label": "x", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "y", "label": "y", "min": -3, "max": 3, "step": 0.5, "initial": 0.5}
  ],
  "outputs": [
    {"label": "x times y", "formula": "x*y", "digits": 2},
    {"label": "1 - xy (sign decides the case)", "formula": "1 - x*y", "digits": 2},
    {"label": "(x+y)/(1-xy) - the raw arctan argument", "formula": "(x+y)/(1-x*y)", "digits": 2}
  ],
  "caption": "At x=1, y=0.5: xy=0.5, so 1-xy=0.5 (positive) — direct case applies. Argument is 1.5/0.5=3, and tan^-1(3) really does equal tan^-1(1)+tan^-1(0.5). Now drag x up to 3: 1-xy flips negative, and the same formula shape now needs a +pi correction before it matches the true sum."
}
```
