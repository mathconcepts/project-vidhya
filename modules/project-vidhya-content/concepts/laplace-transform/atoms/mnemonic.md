---
id: laplace-transform.mnemonic
concept_id: laplace-transform
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**The device: STEP.** Four families cover almost every transform pair GATE asks for, and the word STEP names them in the order they get harder to forget:

- **S**tep — $1 \leftrightarrow \dfrac{1}{s}$
- **T**rig — $\sin\omega t \leftrightarrow \dfrac{\omega}{s^2+\omega^2}$, $\cos\omega t \leftrightarrow \dfrac{s}{s^2+\omega^2}$
- **E**xponential — $e^{at} \leftrightarrow \dfrac{1}{s-a}$
- **P**ower — $t^n \leftrightarrow \dfrac{n!}{s^{n+1}}$

Everything else in the table is one of these shifted by the first shifting theorem ($e^{at}f(t) \leftrightarrow F(s-a)$) or built by linearity.

**Worked micro-example.** Find $\mathcal{L}\{t^3\}$. Go straight to **P**ower with $n=3$: $\dfrac{n!}{s^{n+1}} = \dfrac{3!}{s^4} = \dfrac{6}{s^4}$. No integration needed — the factorial in the numerator is the whole rule.

**Sanity-check reflex:** count the degree. A $t^n$ term should leave you with $s^{n+1}$ in the denominator and $n!$ on top — if your denominator's power doesn't match $n+1$, you dropped a step in **P**ower, not made an arithmetic slip elsewhere.
