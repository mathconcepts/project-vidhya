---
id: ray-optics.interleaved-drill
concept_id: ray-optics
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
tested_by_atom: ray-optics.micro-exercise
---

**Cross-concept check: ray-optics → wave-optics.**

**Question 1 (does more magnification always mean more detail?):** A telescope's angular magnification is $M=f_o/f_e$ — in principle, choosing a smaller and smaller eyepiece focal length $f_e$ makes $M$ arbitrarily large. Does this mean an arbitrarily small object detail can always be resolved by using a small enough eyepiece?

*Answer:* No. $M=f_o/f_e$ is a ray-optics formula and says nothing about the smallest detail the telescope's aperture can distinguish in the first place — that limit comes from **diffraction**, a wave phenomenon ray optics does not model at all. Magnifying past that limit only enlarges an already-blurred image; no new detail appears.

**Question 2 (the actual limit, from the next concept):** A telescope has an aperture (objective diameter) $D=0.1\text{ m}$, observing light of wavelength $\lambda=500\text{ nm}$. Find the smallest angle it can resolve, $\Delta\theta = 1.22\lambda/D$.

*Answer:* $\Delta\theta = \dfrac{1.22 \times 500\times10^{-9}}{0.1} \approx 6.1\times10^{-6}\text{ rad}$ — a fixed number set entirely by wavelength and aperture, with no eyepiece in the formula at all.

**Why this drill exists:** ray optics happily predicts an unlimited magnification, which makes it easy to believe magnification alone solves every resolution problem. The genuine ceiling on what any optical instrument can distinguish comes from treating light as a wave, which is exactly where the next concept begins.
