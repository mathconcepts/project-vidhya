---
id: semiconductor-electronics.worked-example
concept_id: semiconductor-electronics
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A silicon photodiode has band gap $E_g\approx1.1$ eV (the minimum energy needed to lift an electron from the valence band, mostly full of electrons, into the conduction band, where it can carry current). Find the maximum wavelength of light this photodiode can detect at all.

---

**Step 1 — State the absorption condition.** A photon can only excite an electron across the gap if its energy is at least $E_g$. The *longest* detectable wavelength is the one whose photon energy exactly equals $E_g$ — any longer, and every photon falls short.

---

**Step 2 — Write the photon-energy relation.** $E\approx\dfrac{1240}{\lambda(\text{nm})}$ eV (a rounded form of $hc/e$, giving energy in electron volts directly).

---

**Step 3 — Solve for the cutoff wavelength.** Setting $E=E_g$: $\lambda_{max}=\dfrac{1240}{E_g}=\dfrac{1240}{1.1}\approx1127$ nm.

---

**Step 4 — Check against the visible spectrum.** Visible light ends around $700$ nm (deep red); $1127$ nm sits well beyond it, in the near-infrared. So silicon detects the whole visible range and a good stretch of infrared too — exactly why silicon photodiodes are so widely used.

$$\boxed{\lambda_{max}\approx1127\text{ nm}}$$

Answer: $\lambda_{max}\approx1127$ nm.
