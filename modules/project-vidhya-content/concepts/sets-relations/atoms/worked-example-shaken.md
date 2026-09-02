---
# Alternative body for sets-relations.worked-example, stance `shaken`.
id: sets-relations.worked-example.shaken
concept_id: sets-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: sets-relations.worked-example
for_stance: shaken
---

**Problem:** Let $R$ be defined on $S=\{1,2,3,4,5,6\}$ by $aRb \iff 3 \mid (a-b)$. Find the equivalence classes.

---

**Step 1 — Check reflexive.** $a-a=0$, and $3\mid0$. True for every $a$.

---

**Step 2 — Check symmetric.** If $3\mid(a-b)$ then $b-a=-(a-b)$, also divisible by $3$.

---

**Step 3 — Check transitive.** If $3\mid(a-b)$ and $3\mid(b-c)$, add them: $3\mid((a-b)+(b-c))=3\mid(a-c)$.

---

**Step 4 — Find each element's remainder mod $3$.** $1\to1,2\to2,3\to0,4\to1,5\to2,6\to0$.

---

**Step 5 — Group by remainder.** Remainder $0$: $\{3,6\}$. Remainder $1$: $\{1,4\}$. Remainder $2$: $\{2,5\}$.

$$\boxed{3 \text{ equivalence classes: } \{1,4\},\{2,5\},\{3,6\}}$$

Check: $2+2+2=6$, every element used exactly once.
