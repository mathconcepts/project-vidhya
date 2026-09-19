---
id: ray-optics.mnemonic
concept_id: ray-optics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"Against the light, it's a fight — negative."** Any distance measured *against* the direction the incident light travels gets a minus sign. A real object is always measured this way, so $u$ is negative, always, for both mirrors and lenses.

**"Lens has no minus, mirror insists on one."** Lens magnification: $m=+v/u$. Mirror magnification: $m=-v/u$. Whichever formula is in play decides whether that extra minus sign belongs.

**"Dense to rare, or nowhere."** Total internal reflection only ever happens going from a denser medium into a rarer one — never the other way, at any angle.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the object distance and focal length for a convex lens",
  "why": "The image distance and magnification are both read straight off u and f through the lens formula, for any convex lens and any object position -- drag the sliders to see real, inverted, magnified images turn into virtual, upright ones as the object crosses the focal length.",
  "inputs": [
    {"id": "u", "label": "Object distance u (cm, negative)", "min": -50, "max": -10, "step": 5, "initial": -30},
    {"id": "f", "label": "Focal length f (cm, positive for convex)", "min": 10, "max": 30, "step": 5, "initial": 20}
  ],
  "outputs": [
    {"label": "Image distance v (cm) = 1 / (1/f + 1/u)", "formula": "1 / ((1/f) + (1/u))", "digits": 2},
    {"label": "Magnification m = v/u", "formula": "(1 / ((1/f) + (1/u))) / u", "digits": 2}
  ],
  "caption": "Start at u=-30, f=20 (this concept's worked example): v should read 60 and m should read -2 (real, inverted, magnified). Drag u closer than f -- say u=-15 with f=20 -- and v turns negative: the image has flipped to virtual, on the same side as the object."
}
```
