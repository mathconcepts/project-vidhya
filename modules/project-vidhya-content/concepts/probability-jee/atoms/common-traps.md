---
id: probability-jee.common-traps
concept_id: probability-jee
atom_type: common_traps
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

- **Confusing $P(A|B)$ with $P(B|A)$**: JEE routinely gives you $P(\text{defective}\mid\text{machine A})$ and asks for $P(\text{machine A}\mid\text{defective})$ — these are almost never equal, and swapping them is the single most common mistake with Bayes' theorem.
- **Using only one branch as the denominator**: Bayes' theorem's denominator is the FULL total probability — every machine's contribution added together — not just the numerator's own branch. Leaving one term out silently inflates every posterior.
- **Treating "mutually exclusive" and "independent" as the same idea**: two mutually exclusive events with nonzero probability can never be independent — if one happens, the other's probability drops to exactly zero.
- **Applying the binomial formula to trials that are not identical and independent**: drawing cards without replacement, or trials whose success probability changes partway through, break the formula's own assumptions even though it still produces a number.
- **Forgetting to check that the priors sum to $1$**: before applying total probability or Bayes, verify $P(E_1)+P(E_2)+\dots+P(E_n)=1$. A typo in the given data becomes invisible if this check is skipped.
