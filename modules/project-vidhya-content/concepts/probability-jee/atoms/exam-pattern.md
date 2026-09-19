---
id: probability-jee.exam-pattern
concept_id: probability-jee
atom_type: exam_pattern
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

- **MCQ**: JEE almost always states the partition explicitly (three machines, two urns, a test's sensitivity and specificity) — write out $P(E_i)$ and $P(A|E_i)$ as a small table before touching Bayes' formula at all; that table is the solution's first half.
- **Time**: a binomial NAT question asking "probability of at least $3$ successes out of $5$" almost always needs the complement rule ($1$ minus $P(0)$ minus $P(1)$ minus $P(2)$) rather than direct summation — count which side has fewer terms before computing.
- **Trap**: "at least" and "at most" in binomial questions sum opposite tails of the distribution. Misreading one for the other silently swaps the answer for the wrong side entirely.
- **NAT**: independence questions sometimes ask you to VERIFY independence from given numbers rather than assume it — always compute $P(A)P(B)$ and compare it against the given $P(A\cap B)$ before using any independence shortcut.
- **Trap**: a question phrased as "probability the item came from machine A, given it is defective" is asking for $P(A|D)$, not $P(D|A)$ — the given defect rate — even though both numbers appear in the same sentence.
