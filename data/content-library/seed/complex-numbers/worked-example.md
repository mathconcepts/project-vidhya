# Worked example — De Moivre's theorem for a high power

## Problem

Compute $(1 + i)^{10}$.

## Solution

**Step 1** — Expanding $(1+i)^{10}$ directly via binomial expansion would work but take 10 lines and invite arithmetic errors. Euler form is cleaner.

**Step 2** — Convert $1 + i$ to Euler form.

Magnitude: $r = \sqrt{1^2 + 1^2} = \sqrt{2}$.
Angle: $\theta = \arctan(1/1) = \pi/4$ (first quadrant, so no adjustment needed).

So $1 + i = \sqrt{2} \cdot e^{i\pi/4}$.

**Step 3** — Apply De Moivre's theorem.

$$
(1+i)^{10} = (\sqrt{2})^{10} \cdot e^{i \cdot 10\pi/4} = 2^5 \cdot e^{i \cdot 5\pi/2}
$$

**Step 4** — Simplify $2^5 = 32$ and reduce the angle.

$5\pi/2$ is equivalent to $5\pi/2 - 2\pi = \pi/2$ (subtracting one full turn).

So we have $32 e^{i\pi/2}$.

**Step 5** — Convert back to rectangular form.

$e^{i\pi/2} = \cos(\pi/2) + i\sin(\pi/2) = 0 + i = i$.

Therefore $(1+i)^{10} = 32i$.

## Answer

$$
(1+i)^{10} = 32i
$$

## Verification (sanity check)

Let's verify by computing $(1+i)^2$ first and working up:

- $(1+i)^2 = 1 + 2i + i^2 = 2i$
- $(1+i)^4 = (2i)^2 = -4$
- $(1+i)^8 = (-4)^2 = 16$
- $(1+i)^{10} = (1+i)^8 \cdot (1+i)^2 = 16 \cdot 2i = 32i$ ✓

## Why this problem

This is a paradigm BITSAT problem. The direct approach (binomial expansion) is legal but slow; De Moivre's gets it in four lines. BITSAT's strict time budget rewards the student who recognizes when to change representation.

Note: the verification via repeated squaring also works here and is arguably faster — but only because the exponent happens to be 10. For $(1+i)^{17}$, De Moivre's is unambiguously the fastest route.

## Practice variations

1. Compute $(\sqrt{3} + i)^6$. (answer: $-64$)
2. Find all fourth roots of $16i$. (answer: $2e^{i\pi/8}, 2e^{i 5\pi/8}, 2e^{i 9\pi/8}, 2e^{i 13\pi/8}$)
3. If $z = \cos(\pi/5) + i\sin(\pi/5)$, what is $z^{10}$? (answer: $1$)
