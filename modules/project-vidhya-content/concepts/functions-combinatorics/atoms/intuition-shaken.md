---
# Alternative body for functions-combinatorics.intuition, stance `shaken`.
id: functions-combinatorics.intuition.shaken
concept_id: functions-combinatorics
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: functions-combinatorics.intuition
for_stance: shaken
---

Choose $2$ numbers from $\{1,2,3,4,5\}$, no order: $\{1,2\}$ and $\{2,1\}$ are the same choice. Count: $\binom{5}{2}=10$.

Now arrange $2$ numbers from the same $5$, in order: $(1,2)$ and $(2,1)$ are different. Count: $P(5,2)=5\times4=20$.

$20$ is exactly double $10$. Each unordered pair becomes $2$ ordered pairs, since $2!=2$.

Rule: order matters, use $P(n,k)$. Order doesn't matter, use $\binom{n}{k}$. Check which one the question is actually asking before picking a formula.
