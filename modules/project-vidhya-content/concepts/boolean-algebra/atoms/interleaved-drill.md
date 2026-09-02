---
id: boolean-algebra.interleaved-drill
concept_id: boolean-algebra
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: Boolean algebra → propositional logic.**

Boolean operations and propositional connectives are the same structure under different names: $\cdot\leftrightarrow\land$, $+\leftrightarrow\lor$, $'\leftrightarrow\neg$, $1\leftrightarrow T$, $0\leftrightarrow F$.

**Question 1 (Boolean algebra):** Simplify $X\cdot1 + X'\cdot0$.

*Answer:* $X\cdot1=X$ (identity law), $X'\cdot0=0$ (null law), so the sum is $X+0=X$.

**Question 2 (propositional logic):** Translate that same simplification into propositional form and verify with a truth table.

*Answer:* $(P\land T)\lor(\neg P\land F) \equiv P$. Check both rows of $P$: $P{=}T$: $(T\land T)\lor(F\land F)=T\lor F=T$ ✓. $P{=}F$: $(F\land T)\lor(T\land F)=F\lor F=F$ ✓. Matches $P$ in both rows.

**Why this drill exists:** the identity and null laws in Boolean algebra are exactly the "$T$ is a no-op for AND" and "$F$ kills an AND" facts from truth tables, taught with different symbols — recognizing the dictionary both ways turns memorized law-names into things you can re-derive from a $2$-row truth table when memory fails.
