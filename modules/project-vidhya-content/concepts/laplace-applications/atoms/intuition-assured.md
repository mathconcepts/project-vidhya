---
# Alternative body for laplace-applications.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: laplace-applications.intuition.assured
concept_id: laplace-applications
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: laplace-applications.intuition
for_stance: assured
---

Recognising when Laplace is the right tool is pattern-matching: initial conditions given, constant coefficients, a standard input (step, ramp, impulse, sinusoid) — GATE usually hands you two of the three together.

The theorem worth guarding, not reciting: a final value only exists once the transient has genuinely died out. Try the formula on $F(s)=1/(s^2+1)$ anyway: it returns $\lim_{s\to0}sF(s)=0$, but the true time function is $\sin t$, which oscillates forever and settles nowhere, let alone at $0$. Undamped oscillation, or outright growth, breaks the theorem without any warning: nothing in the arithmetic flags the substitution as invalid, so a wrong steady-state slips through looking exactly like a right one.

The initial-value theorem, $f(0^+)=\lim_{s\to\infty}sF(s)$, needs $F(s)$ strictly proper — numerator degree below denominator degree. Apply it to an improper $F(s)$ and you get a finite value for a function that actually jumps or is unbounded at $t=0^+$.

Differentiation-to-multiplication is the mechanism everyone already has; these two theorems are where a technically correct transform still produces a wrong final claim.
