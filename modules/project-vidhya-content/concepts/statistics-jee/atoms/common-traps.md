---
id: statistics-jee.common-traps
concept_id: statistics-jee
atom_type: common_traps
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
tested_by_atom: statistics-jee.micro-exercise
---

**Trap 1 — Dividing by $n-1$ instead of $N$.** JEE's variance formula divides by $N$ (the total frequency or number of observations), the same $N$ your Class 10 formula used — never $N-1$. The "$n-1$" version belongs to a different course entirely (sample variance in inferential statistics); mixing it in here gives a number that is close but wrong.

**Trap 2 — Confusing mean deviation's absolute value with variance's square.** $\text{MD}=\dfrac{\sum|x-\bar x|}{n}$ uses ABSOLUTE VALUE. $\sigma^2=\dfrac{\sum(x-\bar x)^2}{n}$ uses a SQUARE. Applying one formula's operation while writing down the other's name produces two genuinely different numbers, and only one of them answers the question actually asked.

**Trap 3 — Using a class boundary instead of the midpoint for grouped data.** For the class $10$–$20$, the value to use in every formula is the MIDPOINT, $15$ — not $10$, not $20$. Using an endpoint silently shifts the mean and every deviation computed from it.

**Trap 4 — Reading a higher coefficient of variation as "better."** $\text{CV}=\dfrac{\sigma}{\bar x}\times100$ measures RELATIVE SPREAD, not quality. A lower CV means more consistency — for something you want steady (rainfall, a bowler's economy rate), lower CV is the desirable one, and reading "higher CV" as automatically better reverses the entire point of computing it.

**Trap 5 — Losing the $h^2$ in the step-deviation shortcut.** The formula $\sigma^2=h^2\left[\dfrac{\sum f_iu_i^2}{N}-\left(\dfrac{\sum f_iu_i}{N}\right)^2\right]$ needs the class width $h$ squared and multiplied back in at the very end. Forgetting this factor is easy, since the bracketed part alone looks like a complete, sensible answer — but it is the variance of $u$, not of $x$.
