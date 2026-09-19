---
id: heights-distances.mnemonic
concept_id: heights-distances
atom_type: mnemonic
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
modality: mnemonic
---

**SOH-CAH-TOA, but read only the "TOA" part for most of this topic.** Height is opposite the angle, horizontal distance is adjacent to it — so it is tangent, almost always tangent, unless the problem explicitly gives you the slant length instead (a ladder, a kite's string, a rope), in which case sine or cosine take over.

**One relationship explains every one-vertical-plane problem**: height = distance $\times$ $\tan(\text{angle})$. Drag the angle or the distance below and watch the height rebuild instantly, from the exact same formula whether the tower is $5$ m away or $50$ m away.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Height = distance x tan(angle) — drag either one",
  "why": "Elevation problems are all one relationship: height = distance times tan(angle). Drag the angle or the distance and watch the height rebuild instantly, whether the tower is 5 m or 50 m away.",
  "inputs": [
    {"id": "theta", "label": "angle of elevation (degrees)", "min": 10, "max": 80, "step": 5, "initial": 45},
    {"id": "d", "label": "horizontal distance (m)", "min": 5, "max": 50, "step": 5, "initial": 15}
  ],
  "outputs": [
    {"label": "angle in radians", "formula": "theta*0.0174533", "digits": 3},
    {"label": "height = d * tan(angle)", "formula": "d*tan(theta*0.0174533)", "digits": 2}
  ],
  "caption": "At theta=45 degrees, d=15 m: tan(45 degrees)=1 exactly, so height=15 m. Now drag theta up towards 80 degrees and watch the height climb much faster than the angle does — tangent grows steeply near 90 degrees, which is why elevation angles close to vertical need very precise angle measurements."
}
```
