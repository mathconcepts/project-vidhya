# Teaching Tips: Chain Rule

## Common Student Errors

- **Forgetting to multiply by inner derivative:** Students write $\frac{d}{dx}[e^{3x}] = e^{3x}$, forgetting the $\times 3$.
- **Wrong order in composition:** Students misidentify which is the inner and outer function.
- **Not applying chain rule multiple times:** When you have nested functions like $\ln(\sin(x))$, apply chain rule layer by layer.

## GATE Question Pattern

GATE asks: compute the derivative of composite functions (MCQ or NAT). Typical: $\sin(3x)$, $e^{x^2}$, $(2x+1)^5$, $\sqrt{x^2+1}$, $\ln(x^2)$. Often 1–2 marks. Appears in calculus questions involving integrals too.

## Speed Tricks for MCQs

- **Identify inner/outer:** Always look for the "inside" function and the "outside" function. Inner gets differentiated first, outer gets differentiated second.
- **Multiply by derivative of inner:** This is the key — never forget this multiplication.
- **Repetitive application:** For triple compositions like $\sin(\cos(x^2))$, apply chain rule step-by-step: outer, then middle, then inner.

## Must-Memorize Formulas / Results

- **Chain rule:** $\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)$
- **Common compositions:** $\frac{d}{dx}[\sin(u)] = \cos(u) \cdot u'$, $\frac{d}{dx}[e^u] = e^u \cdot u'$, $\frac{d}{dx}[\ln(u)] = \frac{1}{u} \cdot u'$, $\frac{d}{dx}[(u)^n] = n(u)^{n-1} \cdot u'$
