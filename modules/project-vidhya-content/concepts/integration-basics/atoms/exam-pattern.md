---
id: integration-basics.exam-pattern
concept_id: integration-basics
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want a specific antiderivative evaluated at a point**, or the constant that pins down $C$ from a given initial condition — not the bare indefinite integral. Losing the $+C$ mid-solution, then plugging in a boundary value, gives a wrong numeric answer even when every integration step was right.

  Example: $\int(5x^4-2)\,dx=x^5-2x+C$; if the problem states $F(1)=4$, then $1-2+C=4$ gives $C=5$, so the NAT answer is the specific function $x^5-2x+5$, not the bare family.

- **MCQ questions test the formula list directly** — matching $\int\frac1x\,dx$ to $\ln|x|+C$ (not $\ln x$, note the absolute value), or a trig antiderivative against a sign-flipped distractor ($-\cos x$ vs. $\cos x$ for $\int\sin x\,dx$).

- **MSQ "which of these are valid antiderivatives of $f$" questions exploit the $+C$ family** — several options that differ only by an additive constant are all correct simultaneously.

- **Time budget:** a direct power/trig/exponential-formula integral should take under 45 seconds per term. If you're re-deriving a formula from scratch instead of recalling it, that's a formula worth memorizing before the exam, not during it.
