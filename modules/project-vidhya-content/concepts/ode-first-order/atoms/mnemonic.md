---
id: ode-first-order.mnemonic
concept_id: ode-first-order
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**Try "S-L-E," in that order** — Separable, Linear, Exact — cheapest test first:

- **S**eparable? Can $\dfrac{dy}{dx}$ be split as $g(x)h(y)$?
- **L**inear? Is it $y' + P(x)y = Q(x)$, or one rearrangement away?
- **E**xact? Rewrite as $M\,dx + N\,dy = 0$ and check $\partial M/\partial y = \partial N/\partial x$.

**Worked micro-example:** $\dfrac{dy}{dx} = \dfrac{x}{y}$. Test S first — it separates immediately: $y\,dy = x\,dx$. Integrate: $\dfrac{y^2}{2} = \dfrac{x^2}{2} + C$, so $y^2 = x^2 + C$. No need to check L or E at all — the cheapest test already worked.

**Sanity-check reflex:** after solving, differentiate your answer once and confirm it reproduces the original equation. Here, $2yy' = 2x \Rightarrow y' = x/y$ — matches, so the answer is trustworthy.
