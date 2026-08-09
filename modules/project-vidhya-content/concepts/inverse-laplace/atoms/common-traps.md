---
id: inverse-laplace.common-traps
concept_id: inverse-laplace
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting to rewrite the numerator for complex-pole cases:** When the denominator has a quadratic $(s^2 + 2\sigma s + \sigma^2 + \omega^2)$ and the numerator is linear, students often don't decompose the numerator into a part proportional to the derivative of the denominator plus a constant. This misses the $\cos$ and $\sin$ split. **Always complete the square and rewrite the numerator in the form $A(s+\sigma) + B$.**
- **Mixing up standard pair forms:** $\mathcal{L}^{-1}\left\{\frac{1}{s+a}\right\} = e^{-at}$ but $\mathcal{L}^{-1}\left\{\frac{1}{(s+a)^2}\right\} = te^{-at}$. The latter has a factor of $t$ in front. Many students drop this $t$.
- **Not handling repeated poles correctly:** For a repeated pole like $\frac{1}{(s+a)^n}$, the inverse transform is $\frac{t^{n-1}}{(n-1)!} e^{-at}$, not just $e^{-at}$. The polynomial power in $t$ encodes the pole multiplicity.
