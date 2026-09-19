---
id: indefinite-integration.intuition
concept_id: indefinite-integration
atom_type: intuition
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

You already know all three techniques. The JEE skill is choosing between them in seconds, not doing the algebra. Here is the decision rule, in order:

**1. Substitution first, always.** Scan for a piece of the integrand and its own derivative sitting together. If you find it, nothing else is worth trying.

**2. Product of unlike functions → by parts.** A polynomial times a log, an inverse-trig, or an exponential has no substitution hiding in it — reach for $\int u\,dv=uv-\int v\,du$, choosing $u$ by LIATE order.

**3. Genuine rational function left over → partial fractions.**

The tempting-but-wrong move: seeing a fraction of polynomials and jumping straight to rule 3 without checking rule 1 first. Take $\int \dfrac{x}{(x^2+1)^2}\,dx$. It is a rational function, so partial fractions looks correct — but writing it as $\dfrac{A}{x^2+1}+\dfrac{B}{(x^2+1)^2}$ is a dead end: that ansatz only ever produces an EVEN numerator in $x$, and the actual numerator, $x$, is odd. No $A,B$ can fix that. The real move is rule 1: $u=x^2+1$, $du=2x\,dx$, giving $\int\frac{1}{2}u^{-2}\,du=-\dfrac{1}{2(x^2+1)}+C$ in two lines. Check the denominator's factor structure for a substitution BEFORE you commit to decomposing it.
