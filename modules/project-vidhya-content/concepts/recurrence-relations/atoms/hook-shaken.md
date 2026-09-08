---
# Alternative body for recurrence-relations.hook, stance `shaken`.
id: recurrence-relations.hook.shaken
concept_id: recurrence-relations
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: recurrence-relations.hook
for_stance: shaken
---

A rule: today's count is $5\times$ yesterday minus $6\times$ the day before.

Day $0$: $2$. Day $1$: $5$.

Day $2$: $5(5)-6(2)=25-12=13$.

Day $3$: $5(13)-6(5)=65-30=35$.

Each new value uses only the two before it.

```interactive-spec
{"v":1,"kind":"simulation","title":"A recurrence traced as one closed-form curve","why":"Plotting $a_n=2^n+3^n$ as one continuous curve shows the closed-form solution; the recurrence's daily counts are exact points on this smooth curve, not separately re-derived numbers.","x_expr":"t","y_expr":"2^t+3^t","t_min":0,"t_max":3,"duration_sec":8,"view_box":{"x_min":-0.3,"x_max":3.3,"y_min":-2,"y_max":38},"narration_steps":[{"at_progress":0.0,"text":"Day 0 count: $2$ — one of the two starting values this recurrence needs.","text_shaken":"Start here: Day 0's count is $2$. Just a given number — nothing computed yet.","text_assured":"Seed value: $a_0=2$.","focus_point":true},{"at_progress":0.333,"text":"Day 1 count: $5$ — the second starting value. The rule builds day 2 from both: $5\\times(\\text{day }1)-6\\times(\\text{day }0)$. Before multiplying out — does subtracting $6\\times2=12$ pull the answer down a lot, or barely at all?","text_shaken":"Day 1's count is $5$. To get day 2: take $5\\times5=25$, then subtract $6\\times2=12$. Before doing the subtraction — guess: does $12$ change $25$ by a little, or a lot?","text_assured":"$a_1=5$. Day 2 follows: $5a_1-6a_0=5(5)-6(2)$. Estimate the correction term's weight before evaluating.","focus_point":true},{"at_progress":0.667,"text":"Day 2 $=5(5)-6(2)=25-12=13$. Subtracting $12$ mattered — it shaved off nearly half of $25$, not a rounding-level nudge.","text_shaken":"Day 2 $=25-12=13$. That subtraction really mattered: $12$ is almost half of $25$, not a tiny correction.","text_assured":"$a_2=13$; the correction term is about $48\\%$ of the leading product — non-negligible by design.","focus_point":true},{"at_progress":0.85,"text":"The curve looks like it flows smoothly between whole days — but only the integer days are real population counts here.","text_shaken":"Between day $2$ and day $3$ the line looks smooth and unbroken — but only the whole-day dots are real counts.","text_assured":"The trace is smooth for display only; integer $n$ alone carries a real count.","trap":{"text":"Students read the smooth curve between marked days as if a fractional-day count were real.","avoid":"Only whole-number days are meaningful here — the smooth curve is just $2^n+3^n$ plotted continuously for display; it agrees with the recurrence exactly at integers, but nothing is measured in between."}},{"at_progress":1.0,"text":"Every count actually equals $a_n=2^n+3^n$ — the closed form solving this recurrence directly, no repeated subtraction needed. Day 3 check: $2^3+3^3=8+27=35$, exactly matching the direct computation.","text_shaken":"The formula $a_n=2^n+3^n$ gives every day in one step. Check day 3: $2^3+3^3=8+27=35$ — same answer as subtracting twice.","text_assured":"Closed form: $a_n=2^n+3^n$, from characteristic roots $2,3$. Verify: $a_3=8+27=35$.","emphasize":true,"focus_point":true}]}
```
