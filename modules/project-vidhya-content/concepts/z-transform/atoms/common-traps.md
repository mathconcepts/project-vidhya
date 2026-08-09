---
id: z-transform.common-traps
concept_id: z-transform
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing $z^{-n}$ with $z^n$:** In the standard Z-transform, the exponent is $z^{-n}$, not $z^n$. This is a notational choice that simplifies the transfer-function algebra (poles/zeros are easier to read). Reversing the sign leads to completely wrong answers. **Always double-check the exponent convention in your textbook.**
- **Misplacing the ROC:** The region of convergence (ROC) is crucial for distinguishing causal from non-causal sequences. A pole at $z = a$ typically implies ROC boundary $|z| = |a|$. For a **causal** system (right-sided sequence), the ROC is the exterior of the outermost pole: $|z| > |a_{\max}|$. For **anti-causal** (left-sided), it's the interior: $|z| < |a_{\min}|$. Mixing these up inverts your inverse transform.
- **Forgetting the $z$ factor in standard pairs:** Many standard pairs are given with an extra $z$ in the numerator compared to the Laplace equivalent. For example, $\mathcal{Z}^{-1}\left\{\frac{z}{z-a}\right\} = a^n u[n]$, not $\frac{1}{z-a}$. This $z$ arises naturally from summing the geometric series; don't drop it.
