---
id: differential-equations-jee.mnemonic
concept_id: differential-equations-jee
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
modality: mnemonic
exam_ids: ["*"]
---

**"Order counts, degree measures."** Order asks WHICH derivative is the highest one present — a counting question. Degree asks what POWER that highest derivative is raised to, once every radical and fraction on a derivative is cleared — a measuring question, and only askable after the clearing is done.

**"IF times equation collapses to one derivative."** For $\dfrac{dy}{dx}+Py=Q$, multiplying through by the integrating factor $\mathrm{IF}=e^{\int P\,dx}$ is built specifically so the messy left side becomes $\dfrac{d}{dx}(y\cdot\mathrm{IF})$ — a single product rule, run backwards. You are not solving anything new by finding $\mathrm{IF}$; you are choosing the one multiplier that turns the left side back into a derivative you already know how to undo.

**The universal answer for constant-coefficient linear equations:** every equation of the shape $\dfrac{dy}{dt}+ay=b$ (constant $a,b$) has the same one-line solution shape — a steady state, $b/a$, approached exponentially from the starting value. Drag the sliders below and watch this hold for every $a,b,y_0$ you try.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "dy/dt + a·y = b — the same solution shape, every time",
  "why": "Every constant-coefficient linear DE of this shape solves to steady-state plus a decaying exponential. Drag a, b, and the starting value to see the same formula produce every case.",
  "inputs": [
    {"id": "a", "label": "a (decay rate)", "min": 0.2, "max": 3, "step": 0.2, "initial": 1},
    {"id": "b", "label": "b (source strength)", "min": 0, "max": 5, "step": 0.5, "initial": 1},
    {"id": "y0", "label": "y at t=0", "min": -2, "max": 5, "step": 0.5, "initial": 0},
    {"id": "t", "label": "time elapsed t", "min": 0, "max": 5, "step": 0.25, "initial": 1}
  ],
  "outputs": [
    {"label": "steady state, b/a", "formula": "b/a", "digits": 3},
    {"label": "y(t) = b/a + (y0 − b/a)·e^(−at)", "formula": "b/a + (y0 - b/a)*exp(-a*t)", "digits": 3},
    {"label": "decay factor e^(−at)", "formula": "exp(-a*t)", "digits": 4}
  ],
  "caption": "Set y0 above b/a and the curve falls toward the steady state instead of rising — the same formula, approaching from the other side."
}
```
