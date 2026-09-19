---
id: dual-nature-matter.common-traps
concept_id: dual-nature-matter
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Assuming brighter light means faster photoelectrons**: intensity (brightness) only raises how many photons — light's discrete energy packets — arrive per second, so it only raises **photocurrent** (electrons ejected per second). Only **frequency** sets the top kinetic energy, through $KE_{max}=hf-\phi$. Brightness never enters that formula at all.

- **Treating "below threshold frequency" as "a weak effect"**: below the **threshold frequency** $f_0$, photoemission is not weak — it is exactly zero, forever, however bright or however long the light shines. A single photon below the work function $\phi$ can never free an electron, and photons do not add up their energies between different photons.

- **Slipping a stray factor of $e$ into the stopping-potential conversion**: $eV_0=KE_{max}$ means the *numerical value* of $V_0$ in volts already equals $KE_{max}$ in eV — no extra multiplication by the electron's charge ($1.6\times10^{-19}$ C) is needed once both sides are kept in eV/V units together.

- **Using $12.27/\sqrt{V}$ for a particle that is not an electron**: that shortcut number already bakes in the electron's own mass and charge. For a proton or an alpha particle (a helium nucleus, $2$ protons $+$ $2$ neutrons), recompute momentum from $p=\sqrt{2mqV}$ using that particle's own mass $m$ and charge $q$ — the constant is not reusable.

- **Forgetting the de Broglie relation needs momentum, not kinetic energy**: $\lambda=h/p$, and $p\ne\sqrt{2mKE}$ unless $KE$ was itself computed from an accelerating potential correctly; mixing up momentum and kinetic energy formulas is an easy way to lose a factor of $2$.
