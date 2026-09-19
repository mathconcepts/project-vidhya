---
id: limits-jee.mnemonic
concept_id: limits-jee
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"Sine, tan, exp-minus-one, log-of-one-plus — all over $x$, all go to $1$."** That single line covers four of the six standard limits at once: $\dfrac{\sin x}{x}$, $\dfrac{\tan x}{x}$, $\dfrac{e^x-1}{x}$, $\dfrac{\ln(1+x)}{x}$ — every one of them $\to1$ as $x\to0$.

**The one that breaks the pattern, on purpose:** $\dfrac{a^x-1}{x}\to\ln a$, not $1$ — because $a^x$ carries an extra $\ln a$ factor from its own base. Remember it as "the odd one out keeps a souvenir of its base."

**The compounding one:** $(1+x)^{1/x}\to e$. Scale it up — $(1+kx)^{m/x}\to e^{km}$ — and every $1^{\infty}$ limit built from this shape becomes a two-second lookup instead of a fresh derivation.

**Coefficient check, every time:** before applying any of these, make sure the number multiplying $x$ inside the function is exactly the number multiplying $x$ in the denominator. If it is not — $\dfrac{\sin5x}{3x}$, say — multiply and divide to force a match before reading off the answer.

```interactive-spec
{"v": 1, "kind": "manipulable", "title": "Drag k and m -- watch the 1-to-the-infinity family rebuild e^(km)", "why": "Every (1+kx)^(m/x) limit as x approaches 0 reduces to e^(km) -- drag k and m and watch this exact formula rebuild the answer every time, not only for one memorised case.", "inputs": [{"id": "k", "label": "k (coefficient inside the base)", "min": -2, "max": 3, "step": 0.5, "initial": 1}, {"id": "m", "label": "m (coefficient on top of the exponent)", "min": -2, "max": 3, "step": 0.5, "initial": 1}], "outputs": [{"label": "limit = e^(km)", "formula": "exp(k*m)", "digits": 4}], "caption": "Start at k=1, m=1 -- the hook's own case -- and check the output reads 2.7183, which is e. Set k=3, m=1 instead and it jumps to 20.0855, which is e^3. Drag either slider: the limit rebuilds from just k times m, every time."}
```
