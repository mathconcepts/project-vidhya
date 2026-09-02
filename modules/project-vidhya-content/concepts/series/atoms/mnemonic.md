---
id: series.mnemonic
concept_id: series
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Less, More, Look": the ratio test's three exits.** Compute $L=\lim\left|\dfrac{a_{n+1}}{a_n}\right|$. $L$ **Less** than $1$ $\Rightarrow$ converges. $L$ **More** than $1$ $\Rightarrow$ diverges. $L$ exactly $1$ $\Rightarrow$ **Look** elsewhere — the test hands you nothing.

**Micro-example:** $a_n=\dfrac{n}{2^n}$ gives $L=\lim\dfrac{n+1}{2n}=\dfrac12$ — Less than $1$, so it converges (in fact to $2$).

**Sanity-check reflex:** whenever you land on $L=1$, stop reaching for the ratio test's verdict — there isn't one. Switch to a $p$-series comparison or the integral test instead of re-computing the same inconclusive limit a second way.
