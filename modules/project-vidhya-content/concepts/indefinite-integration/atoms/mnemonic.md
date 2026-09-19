---
id: indefinite-integration.mnemonic
concept_id: indefinite-integration
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
modality: mnemonic
exam_ids: ["*"]
---

**"LIATE decides who is $u$."** When integration by parts is the right tool, pick $u$ by scanning this list top to bottom and taking whichever type appears FIRST: **L**ogarithmic, **I**nverse trigonometric, **A**lgebraic, **T**rigonometric, **E**xponential. In $\int x\,e^x\,dx$: $x$ is Algebraic, $e^x$ is Exponential, and A comes before E, so $u=x$, $dv=e^x\,dx$. Pick it backwards and the new integral gets harder instead of simpler.

**"Every power rule is the same one line."** For any $n\neq -1$:

$$\int x^n\,dx = \frac{x^{n+1}}{n+1} + C$$

Raise the power by one, divide by the new power. The one excluded case, $n=-1$, is the one everyone forgets under pressure: $\int x^{-1}\,dx=\int \dfrac{1}{x}\,dx=\ln|x|+C$, not $\dfrac{x^0}{0}$ — which is undefined, which is precisely why $n=-1$ is excluded from the power rule in the first place.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the power n — watch the antiderivative fall out",
  "why": "The power rule is one formula for every n except -1. Drag n and the evaluation point to see the antiderivative, the original integrand, and the 1/(n+1) coefficient update together.",
  "inputs": [
    {"id": "n", "label": "power n", "min": 0, "max": 6, "step": 1, "initial": 2},
    {"id": "px", "label": "evaluate at x =", "min": 0.5, "max": 3, "step": 0.5, "initial": 2}
  ],
  "outputs": [
    {"label": "∫xⁿ dx at this x (C=0)", "formula": "px^(n+1)/(n+1)", "digits": 3},
    {"label": "original integrand xⁿ at this x", "formula": "px^n", "digits": 3},
    {"label": "coefficient 1/(n+1)", "formula": "1/(n+1)", "digits": 3}
  ],
  "caption": "Raise n by one, divide by the new power — the same move for every nonnegative integer power. Try n=0: the antiderivative becomes just x, matching ∫1 dx=x+C."
}
```
