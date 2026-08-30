---
# Alternative body for graph-basics.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: graph-basics.worked-example.shaken
concept_id: graph-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: graph-basics.worked-example
for_stance: shaken
---

**Setup.** Five vertices, $7$ edges. Four degrees are $2,3,2,4$. Find the fifth, $d_5$.

**Step 1 — turn the edge count into a degree total.** Every edge has two ends, so it adds $1$ to each of two vertices. Seven edges therefore contribute $14$ across the whole graph: $\sum\deg(v)=2|E|=14$.

**Step 2 — add the four you were given.** $2+3+2+4=11$.

**Step 3 — subtract.** $11+d_5=14$, so $d_5=3$. That is option **(C)**.

**Step 4 — check it.** Degrees $2,3,2,4,3$ sum to $14$, which is $2\times7$. The edge count matches, and $3$ is at most $4$, the largest degree possible here.

**Why $4$ is the ceiling.** A vertex has only the other $4$ vertices to join to, and in a simple graph it cannot use the same one twice or join to itself. So $d_5=5$ was never available, whatever the parity said.

**Hold onto this.** The degree sum is twice the edge count. Given the edges, that one equation hands you a missing degree directly — no case-checking needed.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Handshaking Lemma in 5-Vertex Graph","steps":[{"prompt":"Step 1: The graph has 7 edges. What must the five degrees sum to?","hint":"The handshaking lemma: the degrees sum to 2|E|, because every edge contributes 1 to each of its two endpoints.","answer":"2(7) = 14"},{"prompt":"Step 2: What do the four known degrees add up to?","hint":"Add 2 + 3 + 2 + 4.","answer":"11"},{"prompt":"Step 3: Find the fifth degree.","hint":"Subtract the known sum from the total: d5 = 14 - 11.","answer":"d5 = 3, which is option (C)"},{"prompt":"Step 4: Suppose the edge count had been left out. What would the handshaking lemma alone tell you?","hint":"11 is odd, and the total must be even. odd + odd = even.","answer":"Only that d5 is odd. That leaves both (A) 1 and (C) 3 alive, and both are genuinely realisable graphs -- parity narrows the field without picking a winner."},{"prompt":"Step 5: Options (B) 2 and (D) 5 are both impossible, but for different reasons. Name each.","hint":"One fails the parity test. The other fails a bound that has nothing to do with parity.","answer":"(B) 2 is even, so 11 + 2 = 13 is odd and cannot equal 2|E|. (D) 5 exceeds the maximum degree in a simple graph on 5 vertices, which is 4 -- a vertex has only 4 other vertices available and cannot repeat an edge or loop to itself."}],"caption":"Parity filters the candidates; the edge count or the degree bound is what finally picks one."}
```
