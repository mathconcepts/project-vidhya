---
# Alternative body for functions-combinatorics.worked-example, stance `shaken`.
id: functions-combinatorics.worked-example.shaken
concept_id: functions-combinatorics
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: functions-combinatorics.worked-example
for_stance: shaken
---

**Problem:** How many surjective (onto) functions are there from a $4$-element set $\{1,2,3,4\}$ to a $2$-element set $\{a,b\}$?

---

**Step 1 — Count all functions.** Each of $4$ elements picks $a$ or $b$ independently: $2\times2\times2\times2=16$.

---

**Step 2 — Ask which of these 16 are NOT onto.** A function misses being onto only if every element lands on the same single output.

---

**Step 3a — Count "all map to $a$."** That's $1$ function.

---

**Step 3b — Count "all map to $b$."** That's also $1$ function. These two don't overlap.

---

**Step 4 — Subtract.** $16-1-1=14$.

$$\boxed{14 \text{ surjective functions}}$$

Check: $\binom{2}{0}2^4-\binom{2}{1}1^4=16-2=14$ ✓, the same answer from the general inclusion-exclusion formula.
