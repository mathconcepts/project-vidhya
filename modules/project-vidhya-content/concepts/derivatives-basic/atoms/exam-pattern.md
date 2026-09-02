---
id: derivatives-basic.exam-pattern
concept_id: derivatives-basic
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want a single evaluated number, not the general derivative.** The question gives a polynomial and a point, and the expected entry is $f'(a)$ as a decimal or fraction — the general expression $f'(x)$ is only the intermediate step, never the final entry.

  Example: for $f(x) = 2x^3 - 4x$, $f'(x) = 6x^2 - 4$, so $f'(1) = 6 - 4 = 2$. That single number, $2$, is what goes in the box — not "$6x^2-4$."

- **MCQ options are built from one dropped or misapplied rule each.** A wrong option is rarely random; it is typically "forgot the constant multiple," "used $n$ instead of $n-1$ in the exponent," or "differentiated a sum as if only the first term mattered." Recomputing term by term, rather than pattern-matching an option, avoids all three at once.

- **Mixed questions combine two or three basic derivatives** ($x^n$, $e^x$, $\sin x$, $\cos x$, constants) inside one sum, testing whether the sum rule is applied cleanly across different function families in the same expression.

- **Time budget:** a pure power/sum-rule evaluation, with no composite structure, should take well under a minute — it is mechanical term-by-term work with no decision to make about which rule applies.
