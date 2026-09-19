---
id: alternating-current.common-traps
concept_id: alternating-current
atom_type: common_traps
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
---

- **Using peak values where power needs rms values.** $P_{avg} = V_{rms}I_{rms}\cos\phi$ — plugging in $V_0$ and $I_0$ directly gives an answer exactly double the correct one, since $V_{rms}I_{rms} = V_0I_0/2$. Rms values exist specifically so that ordinary DC power formulas keep working for AC.

- **Reading average value as rms value, or the reverse.** Over a half cycle, $V_{avg} = 2V_0/\pi \approx 0.637\,V_0$, while $V_{rms} = V_0/\sqrt2 \approx 0.707\,V_0$ — two different numbers, from two different derivations (a plain average versus a mean-of-squares). Mixing them up in a heating-effect question (which needs rms) is a common slip.

- **Forgetting that reactance depends on frequency, but resistance does not.** Doubling $\omega$ doubles $X_L$ and halves $X_C$, while $R$ stays exactly the same. A "what happens to the impedance if frequency doubles" question cannot be answered by scaling $Z$ itself — each piece inside the square root must be recomputed separately first.

- **Treating "current lags voltage" and "current leads voltage" as interchangeable descriptions of the same phase difference.** A net-inductive circuit ($X_L>X_C$) has current *lagging*; a net-capacitive circuit ($X_C>X_L$) has current *leading*. Swapping the two flips the sign of $\phi$ and gets circuit-behaviour questions (like which element to add to bring the circuit to resonance) backwards.

- **Assuming a real transformer conserves current the way it conserves power.** $V_pI_p = V_sI_s$ holds only for an *ideal, lossless* transformer, and even then it is power, $VI$, that is conserved — current itself changes inversely with the turns ratio, exactly the opposite of the voltage change, not the same amount.
