---
id: residue-calculus.mnemonic
concept_id: residue-calculus
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Only the inside counts, only $c_{-1}$ matters."** The residue theorem in one phrase: singularities outside the contour contribute nothing, and of everything a singularity's Laurent series carries, only the $z^{-1}$ coefficient survives into the answer.

**Worked micro-example.** $\oint_{|z|=1.5}\frac{dz}{(z-1)(z+2)}$: pole at $z=1$ is inside ($|1|<1.5$), pole at $z=-2$ is outside ($|-2|=2>1.5$). Only $z=1$ counts: $\text{Res}=\lim_{z\to1}\frac1{z+2}=\frac13$, so the integral is $2\pi i\cdot\frac13=\frac{2\pi i}3$ — the outside pole never enters the sum.

**Sanity-check reflex.** Before summing residues, redraw the contour radius against every pole's modulus — a pole included by mistake (or excluded by mistake) doesn't announce itself; the number it still produces will look just as clean as the correct one.
