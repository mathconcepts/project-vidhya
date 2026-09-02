---
id: propositional-logic.interleaved-drill
concept_id: propositional-logic
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: propositional logic → Boolean algebra.**

Propositional connectives and Boolean operations are the same structure wearing different names: $\land\leftrightarrow\cdot$, $\lor\leftrightarrow+$, $\neg\leftrightarrow{}'$, $T\leftrightarrow1$, $F\leftrightarrow0$.

**Question 1 (propositional logic):** Is $\neg(P\land Q)\lor(P\land Q)$ a tautology?

*Answer:* Yes — it has the form $X\lor\neg X$ with $X=P\land Q$, true regardless of $X$'s own truth value. This is the **law of excluded middle**.

**Question 2 (Boolean algebra):** Translate that same identity into Boolean form and simplify.

*Answer:* $X' + X = 1$ — the **complement law**. Same structure, same proof by case-split on $X$ true/false, different vocabulary: "tautology" in logic is "identically $1$" in Boolean algebra.

**Why this drill exists:** students fluent in truth tables often freeze on a Karnaugh map, and vice versa, because the two topics are taught with different symbols for the same objects. Recognizing $\lor\leftrightarrow+$ and $\land\leftrightarrow\cdot$ turns every propositional-logic identity into a Boolean-algebra one for free — De Morgan's law is the same theorem in both files.
