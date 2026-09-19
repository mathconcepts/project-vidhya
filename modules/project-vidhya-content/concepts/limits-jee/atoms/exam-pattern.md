---
id: limits-jee.exam-pattern
concept_id: limits-jee
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How JEE Main actually asks this.**

- **NAT questions ask for the limit's numeric value directly** — identify the indeterminate form, pick the fastest resolving method (standard limit first, L'Hôpital only if nothing standard fits), and report the number. Example: $\lim_{x\to0}\frac{\sin 4x}{x}=4$, read off in one line once the form is confirmed as $\frac00$.

- **MCQ "identify the form" questions test recognition, not computation.** Given four expressions, one is $\frac00$ at the stated point, the others are not — picking which one *needs* a limiting technique at all is the actual skill being tested.

- **Trap: an indeterminate-looking expression that already has a defined value.** $\lim_{x\to0}\frac{x^2+3}{x+1}$ looks like it needs work but direct substitution gives $3$ immediately — no standard limit, no L'Hôpital, nothing indeterminate about it. Distractors are built assuming students apply machinery here anyway.

- **Time budget:** spotting the indeterminate form and matching it to a standard limit should cost under 15 seconds for a JEE-level trig or exponential limit. Reaching for two rounds of L'Hôpital's rule when a standard limit already answers it is the single biggest time leak on this topic — and with board practicals nine days after JEE Session 1, there is no spare time to leak.
