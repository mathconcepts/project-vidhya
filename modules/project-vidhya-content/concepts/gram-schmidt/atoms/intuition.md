---
id: gram-schmidt.intuition
concept_id: gram-schmidt
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
---

Picture $v_1$ as a fixed rail and $v_2$ as an arrow leaning against it. Some of $v_2$ points along the rail — that part is its **projection** onto $v_1$ — and some of it points away from the rail. Gram-Schmidt keeps only the "away" part: $u_2 = v_2 - \text{proj}_{u_1}v_2$.

That leftover $u_2$ is orthogonal to $u_1$ by construction, no matter what $v_2$ was. Try it yourself below: drag $v_2$ anywhere and the "check" output stays at zero every time — subtracting the exact projection always removes the *entire* along-$u_1$ component, never more, never less.

With three or more vectors, the process repeats: each new $u_i$ has the projection onto *every* earlier $u_j$ stripped out, one at a time, before it's declared orthogonal to the whole set built so far.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag v2 and watch its orthogonal leftover against a fixed u1 = (1,1)",
  "inputs": [
    {"id": "v2x", "label": "v2 (x)", "min": -3, "max": 3, "step": 0.5, "initial": 2},
    {"id": "v2y", "label": "v2 (y)", "min": -3, "max": 3, "step": 0.5, "initial": 0}
  ],
  "outputs": [
    {"label": "projection coefficient c = (v2·u1)/(u1·u1)", "formula": "(v2x + v2y) / 2", "digits": 2},
    {"label": "u2 (x) = v2x − c", "formula": "v2x - (v2x + v2y) / 2", "digits": 2},
    {"label": "u2 (y) = v2y − c", "formula": "v2y - (v2x + v2y) / 2", "digits": 2},
    {"label": "check: u1 · u2 (always 0)", "formula": "1 * (v2x - (v2x + v2y) / 2) + 1 * (v2y - (v2x + v2y) / 2)", "digits": 4}
  ],
  "caption": "u1 = (1,1) is fixed. Wherever you drag v2, the check stays 0 — subtracting the exact projection guarantees orthogonality, not an approximation of it."
}
```
