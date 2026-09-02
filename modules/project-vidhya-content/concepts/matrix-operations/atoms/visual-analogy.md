---
id: matrix-operations.visual-analogy
concept_id: matrix-operations
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: visual
---

Think of $A$ and $B$ as translators. $B$ translates German into French; $A$ translates French into English. Feed a German sentence through $B$ then $A$, and you get an English sentence directly — that pass-through is exactly what the matrix $AB$ *is*: one translator built by chaining two others, French never appearing on the page.

Chain them in the other order — $A$ first, $B$ second — and the pipeline doesn't even parse: $A$ expects French, not whatever $B$ would have produced from it. Even when both $AB$ and $BA$ exist, they are two genuinely different combined translators, not the same rulebook read backwards, which is exactly why $AB \neq BA$ in general — order is part of what the product means, not decoration on top of it.

Addition and transpose don't have this composition story: adding two translators isn't a well-defined idea, and transpose is closer to swapping which language is treated as "input" versus "row" — a relabeling, not a chained action.
