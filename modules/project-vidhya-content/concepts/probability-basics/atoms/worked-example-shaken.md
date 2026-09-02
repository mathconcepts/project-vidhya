---
# Alternative body for probability-basics.worked-example, served when the
# learner stance is `shaken`. See src/content/stance-variants.ts. Prose is
# held at or below the base atom's length; counting people replaces
# formula manipulation until the final check.
id: probability-basics.worked-example.shaken
concept_id: probability-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: probability-basics.worked-example
for_stance: shaken
---

**Problem.** Same setup: 1% have the disease. Test catches 99% of true cases, wrongly flags 5% of healthy people. Someone tests positive — probability they're actually sick?

---

**Step 1 — Imagine 10,000 people.** 1% are sick: $10{,}000 \times 0.01 = 100$ sick, $9{,}900$ healthy.

---

**Step 2 — Count true positives.** 99% of the 100 sick people test positive: $100 \times 0.99 = 99$.

---

**Step 3 — Count false positives.** 5% of the 9,900 healthy people test positive anyway: $9{,}900\times0.05 = 495$.

---

**Step 4 — Count all positives.** $99 + 495 = 594$.

---

**Step 5 — Divide.** Of those 594 positives, only 99 are actually sick:
$$\boxed{\frac{99}{594} = \frac{1}{6} \approx 0.167}$$

**Check.** Using the formula instead of counting people: $P(\text{pos}) = 0.99(0.01)+0.05(0.99)=0.0594$, and $P(D\mid\text{pos})=0.0099/0.0594 = 1/6$ — same answer both ways.
