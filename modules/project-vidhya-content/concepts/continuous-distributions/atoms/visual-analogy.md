---
id: continuous-distributions.visual-analogy
concept_id: continuous-distributions
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

The standard normal curve peaks at $x=0$ with height $1/\sqrt{2\pi}\approx0.399$, and falls off symmetrically on both sides — never touching zero, but shrinking fast enough that the total area under the whole curve is exactly 1. $z$-scores measure distance along this same curve in units of $\sigma$: $z=\pm1$ marks where the curve has fallen to about 60% of its peak height, and by $z=\pm3$ it's essentially flat against the axis. Every normal distribution, whatever its $\mu$ and $\sigma$, is this exact curve stretched and shifted — which is why one z-table covers all of them.

```gif-scene
{"type":"function-trace","expression":"exp(-(x**2)/2)/sqrt(2*pi)","x_range":[-4,4],"y_range":[0,0.45]}
```
