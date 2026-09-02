---
id: numerical-error-analysis.visual-analogy
concept_id: numerical-error-analysis
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.22
exam_ids: ["*"]
modality: visual
---

Picture an old wooden ruler with smudged tick marks — you can read a length to the nearest millimeter, but beyond that the last digit is a guess. Every reading carries a fixed, honest fuzziness: absolute error, indifferent to what's being measured. Hand someone a 3 mm bolt and 1 mm of fuzziness ruins the measurement; hand them a 3 m plank and the same 1 mm barely registers — relative error, the fuzziness as a fraction of the thing measured, is what tells you whether to trust a reading.

```gif-scene
{"type": "discrete-bars", "values": [25.0, 25.2], "labels": ["true", "measured"]}
```

Two bars, nearly the same height: a true value of $25.0$ and a measurement of $25.2$. The gap looks negligible on this scale — and it is, here, at $0.8\%$ relative error. Shrink both bars to a $0.25$ and $0.252$ scale instead, same absolute gap, and the relative error stays identical only if the ratio holds; change the underlying quantity's size and the same raw gap tells a completely different story.
