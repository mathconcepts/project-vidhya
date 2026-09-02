---
id: propositional-logic.worked-example
concept_id: propositional-logic
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Determine whether $(P \to Q) \to (\neg Q \to \neg P)$ is a tautology.

---

**Step 1 — List all four assignments.** Two variables give $2^2 = 4$ rows: $(P,Q) \in \{(T,T),(T,F),(F,T),(F,F)\}$.

---

**Step 2 — Evaluate the inner pieces.** For each row compute $P\to Q$ and $\neg Q \to \neg P$ separately.

$(T,T)$: $P\to Q = T$; $\neg Q\to\neg P = F\to F = T$.
$(T,F)$: $P\to Q = F$; $\neg Q\to\neg P = T\to F = F$.
$(F,T)$: $P\to Q = T$; $\neg Q\to\neg P = F\to T = T$.
$(F,F)$: $P\to Q = T$; $\neg Q\to\neg P = T\to T = T$.

---

**Step 3 — Combine each row with the outer $\to$.** $(T,T)$: $T\to T = T$. $(T,F)$: $F\to F = T$ (antecedent false — vacuously true). $(F,T)$: $T\to T = T$. $(F,F)$: $T\to T = T$.

---

**Step 4 — Read off the result.** All four rows evaluate to $T$.

$$\boxed{(P\to Q)\to(\neg Q\to\neg P) \text{ is a tautology}}$$

Check: this is the identity $P\to Q \equiv \neg Q\to\neg P$ (a conditional and its contrapositive), written as a single two-way implication — an equivalence, stated this way, always yields a tautology.
