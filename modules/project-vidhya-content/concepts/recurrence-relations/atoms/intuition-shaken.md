---
# Alternative body for recurrence-relations.intuition, stance `shaken`.
id: recurrence-relations.intuition.shaken
concept_id: recurrence-relations
atom_type: intuition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
variant_of: recurrence-relations.intuition
for_stance: shaken
---

Guess: the closed form is one term, $a_n=c\cdot r^n$.

Try $r=2$: $a_0=c$. Since $a_0=2$, $c=2$. Then $a_1$ should be $2\cdot2=4$.

But the real $a_1$ is $5$, not $4$. The guess fails.

Why: the equation $x^2-5x+6=0$ has **two** roots, $2$ and $3$, not one. The real answer needs both: $a_n=c_1\cdot2^n+c_2\cdot3^n$.

Using $a_0=2$ and $a_1=5$: $c_1+c_2=2$ and $2c_1+3c_2=5$. Solve: $c_1=1,c_2=1$. So $a_n=2^n+3^n$.

Check: $a_2=4+9=13$ — matches computing directly from the recurrence.
