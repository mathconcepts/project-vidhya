---
id: probability-basics.exam-pattern
concept_id: probability-basics
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions on Bayes' theorem give you sensitivity/specificity-style numbers and ask for a single posterior probability.** Compute $P(B)$ via total probability first — it's the step students skip, guessing $P(B)$ instead of deriving it from the two conditional branches.

  Example: $P(D)=0.01$, $P(\text{pos}\mid D)=0.99$, $P(\text{pos}\mid\bar D)=0.05$ gives $P(\text{pos})=0.0594$ and $P(D\mid\text{pos})=1/6\approx0.167$.

- **MCQ "which statement is true" questions test the axioms directly:** $0\le P(A)\le1$ always; independence ($P(A\cap B)=P(A)P(B)$) and mutual exclusivity ($P(A\cap B)=0$) are different conditions, not synonyms, and a question offering both as if interchangeable is testing exactly that distinction.

- **MSQ questions on the addition rule** often include both a disjoint pair and an overlapping pair in the same option set — check whether $P(A\cap B)$ needs subtracting before answering either.

- **Time budget:** a direct Bayes' theorem NAT with two given conditionals should take under 2 minutes once total probability is set up; if the algebra is dragging, recheck that $P(\bar D) = 1-P(D)$ was actually substituted.
