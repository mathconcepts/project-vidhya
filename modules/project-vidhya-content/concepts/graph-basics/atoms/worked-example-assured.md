---
# Alternative body for graph-basics.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-basics.worked-example.assured
concept_id: graph-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: graph-basics.worked-example
for_stance: assured
---

$\sum\deg=2|E|=14$; known sum $11$; so $d_5=3$, option **(C)**.

Worth seeing what each constraint actually did. The edge count is what makes the answer unique. Drop it and the handshaking lemma gives only that $11+d_5$ is even, so $d_5$ is odd — and (A) $1$ and (C) $3$ are then both realisable, at $|E|=6$ and $|E|=7$ respectively. Havel–Hakimi confirms each. Parity screens; it does not solve.

The two dead options die independently: (B) $2$ has the wrong parity, while (D) $5$ breaks the degree bound $\Delta\le n-1=4$, which holds no matter how many edges the graph has. Treating parity as though it had eliminated (D) is the slip — it happens to be excluded anyway, so the wrong reasoning survives unpunished here and fails on the next question, where an even option sits inside the bound.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Handshaking Lemma in 5-Vertex Graph","steps":[{"prompt":"Step 1: The graph has 7 edges. What must the five degrees sum to?","hint":"The handshaking lemma: the degrees sum to 2|E|, because every edge contributes 1 to each of its two endpoints.","answer":"2(7) = 14"},{"prompt":"Step 2: What do the four known degrees add up to?","hint":"Add 2 + 3 + 2 + 4.","answer":"11"},{"prompt":"Step 3: Find the fifth degree.","hint":"Subtract the known sum from the total: d5 = 14 - 11.","answer":"d5 = 3, which is option (C)"},{"prompt":"Step 4: Suppose the edge count had been left out. What would the handshaking lemma alone tell you?","hint":"11 is odd, and the total must be even. odd + odd = even.","answer":"Only that d5 is odd. That leaves both (A) 1 and (C) 3 alive, and both are genuinely realisable graphs -- parity narrows the field without picking a winner."},{"prompt":"Step 5: Options (B) 2 and (D) 5 are both impossible, but for different reasons. Name each.","hint":"One fails the parity test. The other fails a bound that has nothing to do with parity.","answer":"(B) 2 is even, so 11 + 2 = 13 is odd and cannot equal 2|E|. (D) 5 exceeds the maximum degree in a simple graph on 5 vertices, which is 4 -- a vertex has only 4 other vertices available and cannot repeat an edge or loop to itself."}],"caption":"Parity filters the candidates; the edge count or the degree bound is what finally picks one."}
```
