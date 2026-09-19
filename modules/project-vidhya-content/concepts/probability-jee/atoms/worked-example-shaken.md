---
id: probability-jee.worked-example-shaken
concept_id: probability-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
variant_of: probability-jee.worked-example
for_stance: shaken
---

**Machines A, B, C: $25\%$, $35\%$, $40\%$ of output. Defect rates: $5\%$, $4\%$, $2\%$. Item is defective. Find $P(A|D)$.**

Step 1. Name events: $A_1,A_2,A_3$ = made by A, B, C. $D$ = defective.

Step 2. Given: $P(A_1)=0.25$, $P(A_2)=0.35$, $P(A_3)=0.40$. Check: $0.25+0.35+0.40=1$. Correct.

Step 3. Given: $P(D|A_1)=0.05$, $P(D|A_2)=0.04$, $P(D|A_3)=0.02$.

Step 4. Total probability: $P(D)=0.25(0.05)+0.35(0.04)+0.40(0.02)$.

Step 5. Compute each term: $0.0125+0.014+0.008=0.0345$.

Step 6. Bayes: $P(A_1|D)=0.0125/0.0345\approx0.362$.

Step 7. Same way: $P(A_2|D)\approx0.406$. $P(A_3|D)\approx0.232$.

Check: $0.362+0.406+0.232=1.000$. Correct.
