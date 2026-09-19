---
id: three-d-geometry.mnemonic
concept_id: three-d-geometry
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"Cross the directions, dot the gap, divide by the cross."** Three steps, in that order, for the shortest distance between skew lines:

1. **Cross** the two direction vectors: $\vec n=\vec b_1\times\vec b_2$.
2. **Dot** the vector connecting one point on each line into $\vec n$: $(\vec a_2-\vec a_1)\cdot\vec n$.
3. **Divide** the absolute value of that number by $|\vec n|$.

Say it in that order and you can never accidentally divide by the wrong length or dot the wrong pair of vectors together.

For the plane-vs-normal correspondence, remember: **"the equation's own coefficients are the normal — nothing to compute."** $ax+by+cz=d$ hands you $\vec n=(a,b,c)$ for free.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the direction ratios of two skew lines and watch the shortest distance respond",
  "why": "This is the worked example's own two lines, points held fixed. Drag either line's direction and watch the shortest-distance formula — cross, then dot, then divide — respond, without touching the points.",
  "inputs": [
    {"id": "a1", "label": "line 1 direction, x (a₁)", "min": -4, "max": 4, "step": 1, "initial": 1},
    {"id": "b1", "label": "line 1 direction, y (b₁)", "min": -4, "max": 4, "step": 1, "initial": -1},
    {"id": "c1", "label": "line 1 direction, z (c₁)", "min": -4, "max": 4, "step": 1, "initial": 1},
    {"id": "a2", "label": "line 2 direction, x (a₂)", "min": -4, "max": 4, "step": 1, "initial": 2},
    {"id": "b2", "label": "line 2 direction, y (b₂)", "min": -4, "max": 4, "step": 1, "initial": 1},
    {"id": "c2", "label": "line 2 direction, z (c₂)", "min": -4, "max": 4, "step": 1, "initial": 2}
  ],
  "outputs": [
    {"label": "numerator: (A₂−A₁)·(b₁×b₂)", "formula": "(b1*c2 - c1*b2) - 3*(c1*a2 - a1*c2) - 2*(a1*b2 - b1*a2)", "digits": 2},
    {"label": "denominator: |b₁×b₂|", "formula": "sqrt((b1*c2-c1*b2)^2 + (c1*a2-a1*c2)^2 + (a1*b2-b1*a2)^2)", "digits": 3},
    {"label": "shortest distance", "formula": "abs((b1*c2 - c1*b2) - 3*(c1*a2 - a1*c2) - 2*(a1*b2 - b1*a2)) / sqrt((b1*c2-c1*b2)^2 + (c1*a2-a1*c2)^2 + (a1*b2-b1*a2)^2)", "digits": 3}
  ],
  "caption": "The default sliders are the worked example's own lines — A₁=(1,2,1), A₂=(2,−1,−1), fixed. At these defaults the distance should read about 2.121, matching 3/√2 computed there. Drag any direction ratio and watch the distance change, holding both points still."
}
```
