---
id: probability-basics.formal-definition
concept_id: probability-basics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Axioms of probability.** For any event $A$: $P(A) \ge 0$; $P(\Omega)=1$ for the full sample space $\Omega$; and for mutually exclusive $A,B$: $P(A\cup B)=P(A)+P(B)$.

**Conditional probability.**
$$P(A\mid B) = \frac{P(A\cap B)}{P(B)}, \qquad P(B) > 0$$

**Bayes' theorem.**
$$P(A\mid B) = \frac{P(B\mid A)\,P(A)}{P(B)}$$

Use Bayes' theorem specifically when the problem hands you the *reverse* conditional — $P(\text{positive}\mid \text{disease})$ — and asks for the one you actually want, $P(\text{disease}\mid\text{positive})$. The tempting wrong move is treating $P(B\mid A)$ as if it already answers the question, which silently ignores the base rate $P(A)$ — the exact failure mode that makes a highly sensitive test still produce mostly false alarms for a rare condition.
