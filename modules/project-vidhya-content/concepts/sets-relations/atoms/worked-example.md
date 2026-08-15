---
id: sets-relations-worked-example
concept_id: sets-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Sets and Relations — Worked Examples

## Problem 1: Inclusion-Exclusion (GATE Style)

**Question:** In a class of 100 students, 60 take Mathematics, 45 take Physics, and 30 take both. How many students take **neither** subject?

**Step 1 — Apply inclusion-exclusion for the union.**

$$|M \cup P| = |M| + |P| - |M \cap P|$$

$$|M \cup P| = 60 + 45 - 30 = 75$$

**Step 2 — Find the complement.**

Students taking at least one subject $= 75$.

$$\text{Neither} = |U| - |M \cup P| = 100 - 75 = \boxed{25}$$

**Key insight:** The 30 students who take both were counted once in $|M|$ and once in $|P|$, so they were counted **twice** in $|M| + |P|$. Subtracting once gives the correct count.

---

## Problem 2: Equivalence Relation (GATE Style)

**Question:** Let $R$ be a relation on $\mathbb{Z}$ defined by $aRb \Leftrightarrow 3 \mid (a - b)$. Prove that $R$ is an equivalence relation.

**Proof — Reflexivity:** For any $a \in \mathbb{Z}$:
$$a - a = 0 = 3 \times 0 \implies 3 \mid (a - a) \implies aRa \checkmark$$

**Proof — Symmetry:** Suppose $aRb$, i.e., $3 \mid (a - b)$.
$$a - b = 3k \text{ for some } k \in \mathbb{Z}$$
$$\implies b - a = 3(-k) \implies 3 \mid (b - a) \implies bRa \checkmark$$

**Proof — Transitivity:** Suppose $aRb$ and $bRc$.
$$a - b = 3k,\quad b - c = 3m \text{ for some } k, m \in \mathbb{Z}$$
$$a - c = (a - b) + (b - c) = 3k + 3m = 3(k + m) \implies 3 \mid (a - c) \implies aRc \checkmark$$

**Conclusion:** $R$ is reflexive, symmetric, and transitive, so it is an **equivalence relation**. The equivalence classes are:
$$[0] = \{\ldots, -6, -3, 0, 3, 6, \ldots\},\quad [1] = \{\ldots, -5, -2, 1, 4, 7, \ldots\},\quad [2] = \{\ldots, -4, -1, 2, 5, 8, \ldots\}$$

These three classes **partition** $\mathbb{Z}$.

---

## Problem 3: Quick MCQ (GATE Style)

**Question:** Let $A = \{1, 2, 3, 4\}$. The number of reflexive relations on $A$ is:

**(A)** $2^{12}$ **(B)** $2^{16}$ **(C)** $2^{12}$ **(D)** $4^4$

**Solution:**

$|A \times A| = 4^2 = 16$ pairs total.

A reflexive relation **must** include all 4 diagonal pairs $(1,1),(2,2),(3,3),(4,4)$.

The remaining $16 - 4 = 12$ off-diagonal pairs can each be independently **included or excluded**.

$$\text{Number of reflexive relations} = 2^{12}$$

**Answer: (A)**

---

## Common Traps

- **Union vs. intersection:** $|A \cup B| \ne |A| + |B|$ unless $A \cap B = \emptyset$.
- **Partial order is NOT equivalence:** A partial order requires antisymmetry (not symmetry). If a relation is both a partial order and an equivalence relation, then every equivalence class has size 1 (equality relation).
- **Transitivity check in small sets:** Verify ALL pairs $(a,b)$ and $(b,c)$ — not just the obvious ones.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: inclusion-exclusion and an equivalence relation proof","steps":[{"prompt":"In a survey of 200 people, 120 like tea, 80 like coffee, and 40 like both. How many like neither? Write your answer as a number.","hint":"Use inclusion-exclusion: |T∪C| = |T| + |C| - |T∩C|. Then subtract from 200.","answer":"40"},{"prompt":"Is the relation R on ℤ defined by aRb ⟺ a·b > 0 an equivalence relation? If not, which property fails? (Write: yes / reflexivity fails / symmetry fails / transitivity fails)","hint":"Check reflexivity first: does 0R0 hold? Is 0·0 = 0 > 0?","answer":"reflexivity fails"}]}
```
