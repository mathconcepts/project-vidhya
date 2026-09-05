---
id: gram-schmidt.mnemonic
concept_id: gram-schmidt
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Project, then reject."** For each new vector, project it onto every rail already built, then reject (subtract) that projection. What survives is orthogonal to all of them — that two-word pair is the entire algorithm, repeated once per vector.

**Worked in one line:** for $v_2=(2,1)$ against rail $u_1=(1,0)$, project ($c=\tfrac{v_2\cdot u_1}{u_1\cdot u_1}=2$, giving $(2,0)$), then reject ($u_2=(2,1)-(2,0)=(0,1)$). Check: $u_1\cdot u_2=0$.

**Sanity-check reflex:** after building each $u_i$, dot it against every earlier $u_j$. Anything other than $0$ means a projection term was skipped or computed against the wrong (original, not orthogonalized) vector — go back before normalizing anything.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag v2 and the rail u1 — watch the reject vector stay perpendicular",
  "why": "Project v2 onto a fixed-length rail u1, then reject (subtract) that projection — drag v2 and the rail itself, and the leftover always lands exactly perpendicular to u1, whatever you pick.",
  "inputs": [
    {"id": "v2x", "label": "v2 (x)", "min": -3, "max": 3, "step": 0.5, "initial": 2},
    {"id": "v2y", "label": "v2 (y)", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "u1x", "label": "rail u1 (x)", "min": 0.5, "max": 3, "step": 0.5, "initial": 1},
    {"id": "u1y", "label": "rail u1 (y)", "min": 0.5, "max": 3, "step": 0.5, "initial": 1}
  ],
  "outputs": [
    {"label": "c = (v2·u1)/(u1·u1)", "formula": "(v2x*u1x + v2y*u1y) / (u1x^2 + u1y^2)", "digits": 3},
    {"label": "u2x = v2x − c·u1x", "formula": "v2x - ((v2x*u1x + v2y*u1y) / (u1x^2 + u1y^2)) * u1x", "digits": 3},
    {"label": "u2y = v2y − c·u1y", "formula": "v2y - ((v2x*u1x + v2y*u1y) / (u1x^2 + u1y^2)) * u1y", "digits": 3},
    {"label": "check: u1·u2 (should be 0)", "formula": "u1x * (v2x - ((v2x*u1x + v2y*u1y) / (u1x^2 + u1y^2)) * u1x) + u1y * (v2y - ((v2x*u1x + v2y*u1y) / (u1x^2 + u1y^2)) * u1y)", "digits": 4}
  ],
  "caption": "u2 is what's left of v2 after subtracting its shadow on the rail. Drag anything — u1·u2 always reads 0.0000, exactly the sanity-check reflex from the mnemonic."
}
```
