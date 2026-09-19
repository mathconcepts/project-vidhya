---
id: probability-jee.worked-example
concept_id: probability-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Machines A, B, C make $25\%$, $35\%$, $40\%$ of a factory's output, with defect rates $5\%$, $4\%$, $2\%$. An item is picked at random and found defective. Find the probability it came from each machine.**

Name the events first, since mixing up "probability of defective GIVEN machine A" with "probability of machine A GIVEN defective" is the whole danger in this topic. Let $A_1,A_2,A_3$ be "made by A, B, C" and $D$ be "item is defective."

**Given**: $P(A_1)=0.25$, $P(A_2)=0.35$, $P(A_3)=0.40$ — check these sum to $1$: $0.25+0.35+0.40=1.00$. Correct. $P(D|A_1)=0.05$, $P(D|A_2)=0.04$, $P(D|A_3)=0.02$.

**Step 1 — total probability of $D$.** A defective item had to come from SOME machine, so add each machine's contribution:

$$P(D)=P(A_1)P(D|A_1)+P(A_2)P(D|A_2)+P(A_3)P(D|A_3)=0.0125+0.014+0.008=0.0345$$

**Step 2 — apply Bayes' theorem for each machine.**

$$P(A_1|D)=\dfrac{0.0125}{0.0345}\approx0.362 \qquad P(A_2|D)=\dfrac{0.014}{0.0345}\approx0.406 \qquad P(A_3|D)=\dfrac{0.008}{0.0345}\approx0.232$$

$$\boxed{P(A_1|D)\approx0.362,\quad P(A_2|D)\approx0.406,\quad P(A_3|D)\approx0.232}$$

**Check**: the three posteriors sum to $1.000$. And the hook's own puzzle resolves here — Machine B, not Machine A, is the single most likely source ($40.6\%$), even though Machine A has the worst defect rate. Machine A only makes a quarter of all output, which pulls its posterior down despite its higher defect rate.
