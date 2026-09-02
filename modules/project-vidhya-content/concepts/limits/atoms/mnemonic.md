---
id: limits.mnemonic
concept_id: limits
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Check, Chase, Check again."** Check the form at the point (is it really $\frac00$ or $\frac{\infty}{\infty}$?). Chase it with L'Hôpital — differentiate top and bottom once. Check again before you answer, because the new fraction can still be indeterminate.

**Micro-example:** $\lim_{x\to0}\dfrac{1-\cos x}{x^2}$. Check: $\frac00$. Chase: becomes $\dfrac{\sin x}{2x}$. Check again: still $\frac00$ — chase once more to $\dfrac{\cos x}{2}\to\dfrac12$.

**Sanity-check reflex:** every time you finish an L'Hôpital pass, plug the point back in before writing an answer. If it's still $\frac00$ or $\frac{\infty}{\infty}$, you are not done — go around again.
