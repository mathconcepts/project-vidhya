---
id: root-finding.intuition
concept_id: root-finding
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

## Two ways to shrink an error bracket

**Bisection** trusts only the sign of $f$. Start with $[a,b]$ where $f(a)$ and $f(b)$ disagree in sign — the Intermediate Value Theorem guarantees a root inside. Test the midpoint $c$; whichever half still shows a sign change becomes the new bracket. The uncertainty $(b-a)$ halves every step, no matter how ugly $f$ is — a picture of the error shrinking like a ruler folded in half again and again, $10\to5\to2.5\to1.25\to\dots$

**Newton-Raphson** trusts the slope too. At a guess $x_n$, follow the tangent line down to where *it* crosses zero, and use that crossing as the next guess:

$$x_{n+1}=x_n-\frac{f(x_n)}{f'(x_n)}$$

When $f$ is well-behaved near a simple root, this is a far more aggressive error cut: each new error is roughly the *square* of the one before it, so the count of correct digits can double every step instead of adding one.

**Secant** keeps Newton's aggression without ever computing $f'$ — it replaces the tangent with the line through the two most recent guesses. **Fixed-point iteration** rewrites $f(x)=0$ as $x=g(x)$ and just repeats $x_{n+1}=g(x_n)$; whether that even converges depends entirely on $|g'|$ staying below $1$ near the root.
