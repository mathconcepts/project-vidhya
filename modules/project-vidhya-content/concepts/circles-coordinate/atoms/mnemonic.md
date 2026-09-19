---
id: circles-coordinate.mnemonic
concept_id: circles-coordinate
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**Pole and polar, remembered as a swap-and-multiply-back rule.** Take any point (the "pole") and its chord of contact (the "polar"). Their two distances from the centre always multiply out to exactly $r^2$ — the point-distance times the line-distance is a fixed number, no matter where the point sits outside the circle.

This is why the SAME letter, $T$, does two jobs everywhere in this concept: $T=0$ at a point ON the circle gives the tangent there; $T=0$ at a point OUTSIDE gives the chord of contact. Same formula, only the input point's location decides which picture it draws.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag the point — pole and polar always multiply back to r²","why":"The chord of contact IS the polar line of the external point — dragging the point shows why swapping a point for a line and back is called pole–polar duality.","inputs":[{"id":"x1","label":"external point x","min":2,"max":8,"step":0.5,"initial":5},{"id":"y1","label":"external point y","min":-5,"max":5,"step":0.5,"initial":3}],"outputs":[{"label":"distance of the point from the centre","formula":"sqrt(x1^2+y1^2)","digits":3},{"label":"distance of the chord of contact from the centre (circle x²+y²=9)","formula":"9/sqrt(x1^2+y1^2)","digits":3},{"label":"product (always 9 = r²)","formula":"sqrt(x1^2+y1^2) * (9/sqrt(x1^2+y1^2))","digits":2}],"caption":"Circle is x²+y²=9, so r²=9. At (5,3): point-distance≈5.831, chord-distance≈1.543, product=9.00 — drag the point anywhere outside the circle and the product never moves off 9."}
```
