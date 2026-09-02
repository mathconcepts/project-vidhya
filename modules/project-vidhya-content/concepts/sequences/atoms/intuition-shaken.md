---
# Alternative body for sequences.intuition, served when the learner stance
# is `shaken`. Concrete-first, smallest true step, explicit check.
id: sequences.intuition.shaken
concept_id: sequences
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: sequences.intuition
for_stance: shaken
---

Write the first six terms of $a_n=(-1)^n$: $-1,\,1,\,-1,\,1,\,-1,\,1$. It never stops alternating — however far out you go, the next term flips again. Now $a_n=\dfrac{2n+1}{n}$: term 10 is $2.1$, term 100 is $2.01$, term 1000 is $2.001$. Each jump in $n$ shrinks the gap to $2$ toward zero.

Check: does the sequence eventually stay inside a narrow window around one number, permanently? $(-1)^n$ never does — it revisits $-1$ and $1$ forever. $\frac{2n+1}{n}$ does — the gap to $2$ shrinks past any width you name. That check is what "converges" means.
