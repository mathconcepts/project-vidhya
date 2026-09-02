---
id: implicit-differentiation.mnemonic
concept_id: implicit-differentiation
atom_type: mnemonic
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
modality: mnemonic
---

**The sneaky prime.** Every time your pen touches a $y$ while differentiating, tack on a $\frac{dy}{dx}$ right after it — as if $y$ were carrying a silent passenger that has to be written down whenever $y$ moves.

**Worked micro-example:** differentiating $y^4$ with respect to $x$ gives $4y^3 \cdot \dfrac{dy}{dx}$, not $4y^3$ alone — the passenger rides along on every $y$-term, power rule included.

**A mixed term needs both riders.** A term like $xy^2$ has an $x$-part and a $y$-part multiplied together, so it needs the product rule *and* the sneaky prime on the $y$-part: $\dfrac{d}{dx}[xy^2] = y^2 + x\cdot 2y\,\dfrac{dy}{dx}$.

**Sanity-check reflex:** once you've solved for $\dfrac{dy}{dx}$, plug the found slope back into the original equation at a specific point you already know lies on the curve — if the numbers don't line up, the algebra of isolating $\dfrac{dy}{dx}$ went wrong somewhere.
