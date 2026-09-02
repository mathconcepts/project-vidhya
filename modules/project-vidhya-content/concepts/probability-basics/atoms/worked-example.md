---
id: probability-basics.worked-example
concept_id: probability-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** A disease affects 1% of a population. A test for it has 99% sensitivity (correctly flags 99% of those who have the disease) and 95% specificity (correctly clears 95% of those who don't, so 5% of healthy people test positive anyway). A random person tests positive. What is the probability they actually have the disease?

---

**Step 1 — Name the knowns.** $P(D)=0.01$, $P(\text{pos}\mid D)=0.99$, $P(\text{pos}\mid \bar D)=0.05$ (false positive rate), so $P(\bar D)=0.99$.

---

**Step 2 — Find $P(\text{pos})$ via total probability.** Positive results come from true positives *or* false positives:
$$P(\text{pos}) = P(\text{pos}\mid D)P(D) + P(\text{pos}\mid \bar D)P(\bar D) = 0.99(0.01) + 0.05(0.99) = 0.0099 + 0.0495 = 0.0594$$

---

**Step 3 — Apply Bayes' theorem.**
$$P(D\mid \text{pos}) = \frac{P(\text{pos}\mid D)\,P(D)}{P(\text{pos})} = \frac{0.0099}{0.0594}$$

---

**Step 4 — Simplify.**
$$\boxed{P(D\mid \text{pos}) = \frac{1}{6} \approx 0.167}$$

**Check.** Out of 10,000 people: 100 have the disease (1%), of whom 99 test positive; 9,900 are healthy, of whom $0.05\times9900=495$ test positive anyway. Total positives: $99+495=594$. Fraction actually diseased: $99/594 = 1/6$ ✓ — same answer counting people instead of multiplying probabilities.
