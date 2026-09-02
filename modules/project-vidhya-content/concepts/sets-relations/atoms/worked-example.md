---
id: sets-relations.worked-example
concept_id: sets-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Let $R$ be defined on $S=\{1,2,3,4,5,6\}$ by $aRb \iff 3 \mid (a-b)$. Find the equivalence classes of $R$.

---

**Step 1 — Confirm $R$ is an equivalence relation.** Reflexive: $3\mid(a-a)=0$ ✓. Symmetric: $3\mid(a-b) \Rightarrow 3\mid(b-a)$ ✓. Transitive: $3\mid(a-b)$ and $3\mid(b-c)$ give $3\mid((a-b)+(b-c))=3\mid(a-c)$ ✓.

---

**Step 2 — Compute each element's remainder mod $3$.** $1\to1,\ 2\to2,\ 3\to0,\ 4\to1,\ 5\to2,\ 6\to0$.

---

**Step 3 — Group elements sharing a remainder.** Remainder $0$: $\{3,6\}$. Remainder $1$: $\{1,4\}$. Remainder $2$: $\{2,5\}$.

---

**Step 4 — Read off the classes.** $[1]=\{1,4\},\ [2]=\{2,5\},\ [3]=\{3,6\}$ — three classes, each size $2$, covering all six elements exactly once.

$$\boxed{3 \text{ equivalence classes: } \{1,4\},\{2,5\},\{3,6\}}$$

Check: $2+2+2=6=|S|$, and every class has exactly one representative in $\{1,2,3\}$.
