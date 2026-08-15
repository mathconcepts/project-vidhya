---
id: integration-substitution.intuition
concept_id: integration-substitution
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

## Integration by Substitution: Reversing the Chain Rule

Integration by substitution is the antidote to composite functions. When differentiation uses the chain rule to break down nested functions, substitution reassembles them for integration.

**The core insight:** If you recognize that an integrand has the form $f'(g(x)) \cdot g'(x)$, then the integral is simply $f(g(x)) + C$. Substitution lets you spot this pattern.

**The u-substitution recipe:**
1. Identify the "inner function" $u = g(x)$
2. Compute $du = g'(x) \, dx$
3. Rewrite the entire integral in terms of $u$
4. Integrate (usually simpler now)
5. Substitute back

**Why it matters for GATE:** Complex integrals often hide beneath a layer of composition. A substitution that unwraps this layer transforms an impossible-looking integral into something elementary. For instance, $\int x(x^2+1)^5 \, dx$ looks formidable until you recognize $u = x^2+1$ and see $du = 2x \, dx$.

**Trigonometric substitution** extends this: when you face radicals like $\sqrt{1-x^2}$ or $\sqrt{x^2+1}$, a strategic trig substitution (e.g., $x = \sin\theta$) converts the radical into a trig identity, dissolving the complexity.

The method is not a trick—it's recognizing when the integrand encodes a derivative waiting to be released.
