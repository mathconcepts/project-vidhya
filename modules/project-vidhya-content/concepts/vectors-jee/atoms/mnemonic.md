---
id: vectors-jee.mnemonic
concept_id: vectors-jee
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Dot gives a number, cross gives an arrow."** Say it out loud before you start a problem — it settles which formula to reach for before you touch the algebra.

**For the cross product's sign, remember "BAC minus CAB":**

$$\vec a\times(\vec b\times\vec c)=\vec b(\vec a\cdot\vec c)-\vec c(\vec a\cdot\vec b)$$

Read the right side left to right — $\vec b$ times (the letter that skipped it, $\vec a\cdot\vec c$), minus $\vec c$ times (the letter that skipped it, $\vec a\cdot\vec b$). The pattern "B-A-C minus C-A-B" is naming exactly this order.

**For the scalar triple product, remember "the ring never breaks."** $[\vec a\ \vec b\ \vec c]=[\vec b\ \vec c\ \vec a]=[\vec c\ \vec a\ \vec b]$ — walk the three letters around a circle in the same direction, the value never changes. Step out of that ring — swap any two — and the sign flips.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag a flat pair of vectors — watch dot, cross and the angle between them",
  "why": "In a flat plane, the cross product collapses to one signed number — the z-component of the full 3D cross product. Drag the two vectors and watch the dot product, that number, and cos of the angle move together.",
  "inputs": [
    {"id": "a1", "label": "a₁ (a's x-component)", "min": 1, "max": 5, "step": 1, "initial": 3},
    {"id": "a2", "label": "a₂ (a's y-component)", "min": -4, "max": 4, "step": 1, "initial": 0},
    {"id": "b1", "label": "b₁ (b's x-component)", "min": -4, "max": 4, "step": 1, "initial": 2},
    {"id": "b2", "label": "b₂ (b's y-component)", "min": -4, "max": 4, "step": 1, "initial": 2}
  ],
  "outputs": [
    {"label": "a · b = a₁b₁ + a₂b₂", "formula": "a1*b1 + a2*b2", "digits": 2},
    {"label": "a × b (z-component) = a₁b₂ - a₂b₁", "formula": "a1*b2 - a2*b1", "digits": 2},
    {"label": "cos θ = (a·b) / (|a||b|)", "formula": "(a1*b1 + a2*b2) / (sqrt(a1^2+a2^2) * sqrt(b1^2+b2^2))", "digits": 3}
  ],
  "caption": "Start at a=(3,0), b=(2,2): a·b=6, the cross product's z-part is also 6, and cosθ works out to about 0.707 — a 45° angle. Drag either vector and watch all three numbers respond together."
}
```
