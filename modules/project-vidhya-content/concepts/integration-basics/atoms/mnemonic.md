---
id: integration-basics.mnemonic
concept_id: integration-basics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Bump the power, divide by the bump, never forget +C."** For $\int x^n\,dx$: bump the exponent up by one ($n\to n+1$), divide by that same new exponent, then tack on $+C$ — differentiation always erases a constant, so integration can never know which one you started with.

**Worked check:** $\int x^4\,dx$ — bump $4\to5$, divide by $5$: $\dfrac{x^5}{5}+C$. Differentiate back: $\dfrac{d}{dx}\left[\dfrac{x^5}{5}\right]=x^4$. Matches.

**The one exception the mnemonic doesn't cover:** $n=-1$. Bumping gives exponent $0$, and dividing by $0$ is meaningless — that case breaks off into its own rule, $\int x^{-1}\,dx=\ln|x|+C$.

**Sanity-check reflex:** differentiate whatever you just integrated. If it doesn't return the original integrand exactly, the bump-and-divide was applied to the wrong term.
