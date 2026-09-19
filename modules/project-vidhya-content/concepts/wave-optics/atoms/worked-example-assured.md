---
id: wave-optics.worked-example-assured
concept_id: wave-optics
atom_type: worked_example
variant_of: wave-optics.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** In a Young's double-slit setup, $d=0.5\text{ mm}$, $D=1\text{ m}$, $\lambda=500\text{ nm}$. Determine whether the point $y=2\text{ mm}$ above the centre is bright or dark, and separately find the fringe width.

---

**Step 1 — Find $\beta$ first, and classify in units of $\beta$ instead of $\lambda$.** $\beta = \dfrac{\lambda D}{d} = 1\text{ mm}$. Then $\dfrac{y}{\beta} = \dfrac{2}{1} = 2$, a whole number — **bright**, $n=2$ — with no separate nanometre-scale path-difference arithmetic needed at all.

$$\boxed{\text{bright } (n=2), \qquad \beta = 1\text{ mm}}$$

**Why working in units of $\beta$ is not just a units trick.** $y_n=n\beta$ is not a coincidence to be memorised separately — it falls straight out of $\Delta=n\lambda$ once $\beta=\lambda D/d$ is substituted in. This shortcut only classifies bright-versus-dark correctly at points that are exact multiples or exact half-multiples of $\beta$; a point like $y=1.3\text{ mm}$ needs $y/\beta=1.3$ compared honestly against $1$, $1.5$, and $2$ — it is neither, and calling it "close to bright" would be wrong, since interference is a strict integer-or-half-integer condition, not a gradient.
