---
id: random-variables.exam-pattern
concept_id: random-variables
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions give a PMF as a table and ask for $E[X]$, $\text{Var}(X)$, or $E[X^2]$ directly.** Compute both $E[X]$ and $E[X^2]$ from the same table before combining them — don't try to shortcut variance without $E[X^2]$ in hand.

  Example: PMF $0.2,0.3,0.5$ on $X=1,2,3$ gives $E[X]=2.3$ and $\text{Var}(X)=0.61$.

- **MCQ "is this a valid PMF/CDF" questions test the axioms**, not computation: probabilities must be non-negative and sum to 1; a CDF must be non-decreasing and approach 1.

- **MSQ questions on continuous variables test $P(X=a)=0$** — a single-point probability is always zero for a continuous random variable, which trips up students used to discrete tables where individual points *do* carry probability.

- **Time budget:** a PMF table with 3-4 values should yield $E[X]$ and $\text{Var}(X)$ in under 90 seconds — two clean sums and one subtraction, no factoring or integration required.
