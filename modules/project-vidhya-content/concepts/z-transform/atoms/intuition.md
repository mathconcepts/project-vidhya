---

**FILE 2: visual-analogy.md**
```
---
id: z-transform.visual-analogy
concept_id: z-transform
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# Z-Transform: From Continuous Decay to Discrete Sampling

Think of the Z-Transform as a **digital mirror of the Laplace transform**. 

In Laplace, we use $e^{-st}$ to "weight" continuous signals, letting us analyze how systems respond over time. The Z-Transform does the same for digital signals, but using discrete steps instead.

When we sample a continuous signal at intervals $T$, the Laplace exponent $e^{-sT}$ becomes $z^{-1}$ (one sample delay). So the Z-Transform says: *"each past sample is weighted by a power of* $z^{-1}$*—the farther back in time, the smaller the weight."*

**The analogy:**
- Laplace: $\mathcal{L}\{e^{-at}\} = \frac{1}{s+a}$ for continuous decay
- Z-Transform: $\mathcal{Z}\{a^n u[n]\} = \frac{z}{z-a}$ for discrete decay (same pole!)

The poles of $X(z)$ tell you everything: inside the unit circle means stable (samples decay to zero), outside means unstable (samples grow without bound).

```gif-scene
{"type":"parametric","expression":"exp(-t*x)","x_range":[0,5],"y_range":[0,1],"t_range":[0,3],"frames":30,"fps":12}
```
```

PATH:
