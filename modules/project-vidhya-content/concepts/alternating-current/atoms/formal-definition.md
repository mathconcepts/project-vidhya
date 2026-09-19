---
id: alternating-current.formal-definition
concept_id: alternating-current
atom_type: formal_definition
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
---

**Peak, rms, and average values**: for $V(t) = V_0\sin(\omega t)$, the peak value is $V_0$ itself. The rms (root-mean-square) value, the steady DC voltage that would dissipate the same average power, is $V_{rms} = V_0/\sqrt{2} \approx 0.707\,V_0$. The average value over one full cycle is zero (positive and negative halves cancel); over a *half* cycle it is $V_{avg} = 2V_0/\pi \approx 0.637\,V_0$.

**Reactance**: an inductor's opposition to AC is $X_L = \omega L$; a capacitor's is $X_C = \dfrac{1}{\omega C}$. Both are measured in ohms, but unlike resistance, both depend on frequency $\omega$.

**Impedance of a series LCR circuit**: $Z = \sqrt{R^2 + (X_L - X_C)^2}$. Peak current: $I_0 = V_0/Z$.

**Phase angle**: $\tan\phi = \dfrac{X_L - X_C}{R}$, where $\phi$ is the angle by which current lags voltage (positive $\phi$: circuit is net inductive, current lags; negative $\phi$: net capacitive, current leads).

**Resonance**: occurs when $X_L = X_C$, so $Z = R$ (its minimum value) and current is maximum. Resonant angular frequency: $\omega_0 = \dfrac{1}{\sqrt{LC}}$.

**Quality factor**: $Q = \dfrac{\omega_0 L}{R} = \dfrac{1}{R}\sqrt{\dfrac{L}{C}}$ — a measure of how sharply peaked the resonance is; larger $Q$ means a narrower resonance curve.

**Power factor and average power**: $\cos\phi = R/Z$. Average power delivered: $P_{avg} = V_{rms}\,I_{rms}\cos\phi$ — note both values here are rms, never peak.

**Transformer**: for an ideal (lossless) transformer with $N_p$ primary turns and $N_s$ secondary turns, $\dfrac{V_s}{V_p} = \dfrac{N_s}{N_p}$, and since input power equals output power, $V_pI_p = V_sI_s$.
