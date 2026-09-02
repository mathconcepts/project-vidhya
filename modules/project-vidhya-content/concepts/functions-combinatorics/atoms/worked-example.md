---
id: functions-combinatorics.worked-example
concept_id: functions-combinatorics
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** How many surjective (onto) functions are there from a $4$-element set $\{1,2,3,4\}$ to a $2$-element set $\{a,b\}$?

---

**Step 1 — Count all functions, ignoring surjectivity.** Each of the $4$ elements independently maps to $a$ or $b$: $2^4=16$ total functions.

---

**Step 2 — Identify which of those 16 fail to be onto.** A function fails to be onto exactly when its image misses $a$ or misses $b$ — i.e. everything maps to the single remaining element.

---

**Step 3 — Count the failing functions.** "Everything maps to $b$" (misses $a$): $1$ function. "Everything maps to $a$" (misses $b$): $1$ function. These two cases don't overlap. Failing count: $1+1=2$.

---

**Step 4 — Subtract.** $16-2=14$ surjective functions.

$$\boxed{14 \text{ surjective functions from a 4-set onto a 2-set}}$$

Check via inclusion-exclusion directly: $\sum_{i=0}^{2}(-1)^i\binom{2}{i}(2-i)^4 = \binom{2}{0}2^4-\binom{2}{1}1^4+\binom{2}{2}0^4 = 16-2+0=14$ ✓.
