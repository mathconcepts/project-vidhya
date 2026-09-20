---
id: equilibrium-ionic.common-traps
concept_id: equilibrium-ionic
atom_type: common_traps
bloom_level: 4
difficulty: 0.45
exam_ids: ["*"]
---

- **Believing a buffer stops a pH change instead of resisting one**: adding acid or base to a buffer still moves its pH — just by far less than it would in plain water. A buffer has a finite capacity, set by how much acid and conjugate base it actually contains; push past that capacity (or run out of the conjugate base entirely) and the buffer stops resisting altogether.

- **Averaging pH values directly to find a "mixed" pH**: pH is a logarithm of $[\text{H}^+]$, so it does not add or average like an ordinary number. Mixing two solutions at $\text{pH}=3$ and $\text{pH}=5$ does NOT give $\text{pH}=4$ — the actual $[\text{H}^+]$ concentrations (which differ by a factor of $100$, since every whole pH unit is a tenfold change in $[\text{H}^+]$) must be averaged first, and only then converted back to a pH.

- **Mixing up molar solubility with a mass-based solubility when using $K_{sp}$**: $K_{sp}$ expressions need solubility $s$ in mol/L, not g/L. Plugging in a gram-based value (or forgetting to convert at all) silently changes every exponent in $K_{sp}=[\text{A}^{y+}]^x[\text{B}^{x-}]^y$, since the formula only works in molar units.

- **Treating $K_w = 1\times10^{-14}$ as true at every temperature**: this value holds only at $25^\circ\text{C}$. Water's own splitting into $\text{H}^+$ and $\text{OH}^-$ absorbs heat, so $K_w$ actually rises as temperature rises — meaning pure water is not always exactly $\text{pH}=7$; it is only $\text{pH}=7$ at $25^\circ\text{C}$.

- **Assuming every salt gives a neutral, $\text{pH}=7$ solution**: only a salt built from a strong acid AND a strong base does. A salt like $\text{CH}_3\text{COONa}$ (from a weak acid and a strong base) hydrolyses to leave the solution slightly basic, and a salt like $\text{NH}_4\text{Cl}$ (from a weak base and a strong acid) leaves it slightly acidic.
