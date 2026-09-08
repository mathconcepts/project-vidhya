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

**Worked micro-example:** $\dfrac{dV}{dt} = -0.5V$ — the draining tank from the hook, starting at $V=5$. Test S first — it separates immediately: $\dfrac{dV}{V} = -0.5\,dt$. Integrate: $\ln V = -0.5t + C$, so $V = Ae^{-0.5t}$. Using $V(0)=5$ gives $A=5$, so $V(t) = 5e^{-0.5t}$. No need to check L or E at all — the cheapest test already worked.

**Sanity-check reflex:** after solving, differentiate your answer once and confirm it reproduces the original equation. Here, $\dfrac{dV}{dt} = -0.5\cdot 5e^{-0.5t} = -0.5V$ — matches, so the answer is trustworthy.
