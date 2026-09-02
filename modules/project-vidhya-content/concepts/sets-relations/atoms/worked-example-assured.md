---
# Alternative body for sets-relations.worked-example, stance `assured`.
id: sets-relations.worked-example.assured
concept_id: sets-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: sets-relations.worked-example
for_stance: assured
---

**Problem:** Let $R$ be defined on $S=\{1,\dots,6\}$ by $aRb \iff 3\mid(a-b)$. Find the equivalence classes.

Recognize the pattern: $3\mid(a-b)$ is congruence mod $3$, $a\equiv b \pmod 3$ — a standard equivalence relation, so the three axioms don't need re-verifying each time you see this shape.

Classes are residue classes: $[0]=\{3,6\},\ [1]=\{1,4\},\ [2]=\{2,5\}$.

$$\boxed{3 \text{ classes} = \{1,4\},\{2,5\},\{3,6\}}$$

**Worth knowing:** for $S=\{1,\dots,n\}$ under mod-$k$ congruence, the class count is exactly $k$ (assuming $n\ge k$) — no enumeration needed; only $n \bmod k$ determines which classes pick up one extra element over $\lfloor n/k\rfloor$.
