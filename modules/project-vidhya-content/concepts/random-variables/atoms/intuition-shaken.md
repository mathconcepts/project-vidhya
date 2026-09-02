---
# Alternative body for random-variables.intuition, served when the learner
# stance is `shaken`. See src/content/stance-variants.ts.
id: random-variables.intuition.shaken
concept_id: random-variables
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: random-variables.intuition
for_stance: shaken
---

Three values: $X=1,2,3$ with weights $0.2, 0.3, 0.5$.

Check the weights add to 1: $0.2+0.3+0.5=1$. Good.

Draw them as three bars at heights 0.2, 0.3, 0.5.

The running total up to each point is the CDF: at $X=1$, total is $0.2$; at $X=2$, total is $0.5$; at $X=3$, total is $1.0$.

Balance the three bars on one point — that point is $E[X]=1(0.2)+2(0.3)+3(0.5)=2.3$.

Spread around that point is the variance, found from a second sum: $E[X^2]=1(0.2)+4(0.3)+9(0.5)=5.9$, then $\text{Var}(X)=5.9-2.3^2=5.9-5.29=0.61$.
