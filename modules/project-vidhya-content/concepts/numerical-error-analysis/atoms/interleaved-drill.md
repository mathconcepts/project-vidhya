---
id: numerical-error-analysis.interleaved-drill
concept_id: numerical-error-analysis
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: numerical-error-analysis → root-finding.**

Newton-Raphson's error obeys $|e_{n+1}|\approx C|e_n|^2$ near a simple root, with $C=\dfrac{|f''(x^*)|}{2|f'(x^*)|}$. For $f(x)=x^3-x-1$ at $x^*\approx1.32472$: $f''(x^*)=6x^*\approx7.948$, $f'(x^*)\approx4.265$, so $C\approx0.932$.

**Q1.** If the current error is $e_n=0.023$, what does the propagation formula predict for $e_{n+1}$?
**A1.** $e_{n+1}\approx0.932\times0.023^2\approx0.000493$ — roughly $47\times$ smaller, consistent with squaring a small number.

**Q2.** Does this match "quadratic convergence roughly doubles the correct decimal digits per step"?
**A2.** Yes: $e_n\approx0.023$ carries about 1–2 correct digits after the decimal; $e_{n+1}\approx0.0005$ carries about 3–4 — the digit count has roughly doubled in one step, exactly what squaring the error predicts.

**Why this drill exists:** "quadratic convergence" is often memorized as a label without connecting it to the actual error-propagation formula that produces it — treating $|e_{n+1}|\approx C|e_n|^2$ as error-analysis machinery applied to a specific method, not a separate fact about Newton-Raphson.
