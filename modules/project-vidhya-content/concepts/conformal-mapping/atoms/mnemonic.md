---
id: conformal-mapping.mnemonic
concept_id: conformal-mapping
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Smooth AND alive."** Conformal needs the map to be smooth (analytic) *and* alive (derivative not dead, i.e. $f'\neq0$) at that point. Either one missing and the angle-preserving property is gone.

**Worked micro-example.** $f(z)=z^2$ at $z=1$: analytic (entire) and $f'(1)=2\neq0$ — smooth and alive, conformal there. At $z=0$: still analytic, but $f'(0)=0$ — smooth but not alive, not conformal there.

**Sanity-check reflex.** Before declaring a map conformal on a whole region, solve $f'(z)=0$ explicitly and list the roots — "it's a nice function, so it must be conformal everywhere it's defined" skips exactly the check that catches points like $z=0$ for $z^2$.
