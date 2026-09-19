---
id: semiconductor-electronics.worked-example-assured
concept_id: semiconductor-electronics
atom_type: worked_example
variant_of: semiconductor-electronics.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A silicon photodiode has band gap $E_g\approx1.1$ eV. Find its maximum detectable wavelength.

---

**Step 1 — The arithmetic, compressed.** $\lambda_{max}=\dfrac{1240}{E_g}=\dfrac{1240}{1.1}\approx1127$ nm.

$$\boxed{\lambda_{max}\approx1127\text{ nm}}$$

---

**The inversion trap this relation sets up.** $\lambda_{max}=1240/E_g$ runs *backward* from how "bigger" and "smaller" usually feel: a **smaller** band gap gives a **longer** reach into the infrared, not a shorter one — easy to flip by mistake under time pressure.

**Counterexample:** germanium's band gap is smaller than silicon's, $E_g\approx0.7$ eV. Its cutoff works out to $\lambda_{max}=1240/0.7\approx1771$ nm — reaching noticeably *further* into the infrared than silicon's $1127$ nm, precisely because its gap is smaller. This is exactly why germanium, not silicon, was the traditional detector material for deeper infrared and night-vision-range light — a "bigger gap detects further" guess would pick the wrong material entirely.
