---
id: line-integrals.mnemonic
concept_id: line-integrals
atom_type: mnemonic
bloom_level: 2
difficulty: 0.5
exam_ids: ["*"]
modality: mnemonic
---

**"PDDI": Parametrize, Differentiate, Dot, Integrate.** Four motions, always in that order: write $x(t), y(t)$ (Parametrize), find $\mathbf r'(t)$ (Differentiate), form $\mathbf F(\mathbf r(t))\cdot\mathbf r'(t)$ (Dot), then integrate over $t$. Reaching for $\mathbf F\cdot d\mathbf r$ before a parametrization exists is the shortcut that breaks first — there's nothing yet to dot against.

**Worked micro-example:** $\mathbf F=(y,x)$ along $\mathbf r(t)=(t,t^2)$, $0\le t\le1$. Parametrize — given. Differentiate — $\mathbf r'(t)=(1,2t)$. Dot — $\mathbf F(\mathbf r(t))=(t^2,t)$, so $(t^2,t)\cdot(1,2t)=t^2+2t^2=3t^2$. Integrate — $\int_0^1 3t^2\,dt=1$.

**Sanity-check reflex:** count the letters you actually used against the paragraph breaks in your solution — four letters, four visible steps. A solution that jumps straight from "here's the curve" to "here's the number" skipped one, and it's usually the differentiate step.
