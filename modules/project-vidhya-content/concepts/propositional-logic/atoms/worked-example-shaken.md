---
# Alternative body for propositional-logic.worked-example, stance `shaken`.
id: propositional-logic.worked-example.shaken
concept_id: propositional-logic
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: propositional-logic.worked-example
for_stance: shaken
---

**Problem:** Determine whether $(P \to Q) \to (\neg Q \to \neg P)$ is a tautology.

---

**Step 1 — Write the four rows.** $(P,Q)$ can be $(T,T)$, $(T,F)$, $(F,T)$, $(F,F)$. Nothing else is possible with two variables.

---

**Step 2 — Fill in $P\to Q$.** $(T,T)\to T$. $(T,F)\to F$. $(F,T)\to T$. $(F,F)\to T$. Rule: false only when $P$ is true and $Q$ is false.

---

**Step 3 — Fill in $\neg Q\to\neg P$.** $(T,T)$: $\neg Q=F,\neg P=F$, so $F\to F=T$. $(T,F)$: $\neg Q=T,\neg P=F$, so $T\to F=F$. $(F,T)$: $\neg Q=F,\neg P=T$, so $F\to T=T$. $(F,F)$: $\neg Q=T,\neg P=T$, so $T\to T=T$.

---

**Step 4 — Combine and check.** $T\to T=T$. $F\to F=T$. $T\to T=T$. $T\to T=T$. All four rows are $T$.

$$\boxed{\text{tautology — every row is true}}$$

Check: rows 2 and 3 both use the "false antecedent is always true" rule from the hook.
