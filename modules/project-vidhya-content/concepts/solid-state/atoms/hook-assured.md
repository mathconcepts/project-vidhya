---
id: solid-state.hook-assured
concept_id: solid-state
atom_type: hook
variant_of: solid-state.hook
for_stance: assured
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Assuming atoms always touch along the cube's EDGE is true only for simple cubic — applying that same assumption to bcc or fcc gives a wrong relationship between atomic radius and edge length.

In a body-centred cubic cell, the corner and centre atoms touch along the BODY DIAGONAL, not the edge: $\sqrt{3}\,a=4r$. In a face-centred cubic cell, atoms touch along a FACE DIAGONAL instead: $\sqrt{2}\,a=4r$. Using $a=2r$ (the simple-cubic relationship) for either of these silently produces a wrong packing efficiency and a wrong density.

**Knowing atoms touch somewhere along a straight line is necessary — knowing WHICH line (edge, face diagonal, or body diagonal) is what actually depends on the structure.** Identify the structure first, then pick the matching geometric relationship, never the other way round.
