---
id: definite-integration.exam-pattern
concept_id: definite-integration
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.42
modality: text
exam_ids: ["*"]
---

**How JEE actually asks this.**

- **The property-spotting question, disguised as a hard integral.** JEE loves handing you an integrand that is genuinely difficult to antidifferentiate directly, over an interval like $[0,\pi/2]$ or $[0,\pi]$ or $[-a,a]$ — the interval choice is the hint. Before attempting direct integration, always test $f(a-x)$ or $f(-x)$ against $f(x)$ first; a large share of "hard-looking" definite integrals on JEE are solved entirely by a property, with no antiderivative found at all.

- **Trap: applying King's Rule to an integral that does not start at $0$.** The rule needs the exact form $\int_a^b f(x)\,dx=\int_a^b f(a+b-x)\,dx$ — for limits $[2,5]$, the replacement is $x\to 7-x$, not $x\to 5-x$. Using the WRONG replacement (forgetting to add both limits) produces an expression that does not actually equal the original integral.

- **NAT: area-between-curves questions test the crossing check, not the integration.** The arithmetic in these questions is usually short; what separates a correct answer from a wrong one is finding every crossing point inside the interval and confirming which curve is on top on each resulting piece, not the integration itself.

- **Time budget:** spend the first $20$–$30$ seconds of any definite integral checking for a property (symmetry, King's Rule, periodicity) before starting direct computation. A property check costs almost nothing; skipping it and grinding through a hard antiderivative that a one-line property would have avoided is the single biggest time leak on this topic.
