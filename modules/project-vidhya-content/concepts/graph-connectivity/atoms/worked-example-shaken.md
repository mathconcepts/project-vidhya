---
# Alternative body for graph-connectivity.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: graph-connectivity.worked-example.shaken
concept_id: graph-connectivity
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: graph-connectivity-worked-example
for_stance: shaken
---

**Setup.** Six vertices, degrees $3,3,3,3,2,2$.

**Step 1.** Add every degree: $3+3+3+3+2+2=16$.

**Step 2.** By the handshaking lemma this total must be twice the edge count, and $16$ is even, so nothing rules the sequence out yet: $|E|=16/2=8$.

**Step 3 — a tighter check, Erdős–Gallai at $k=4$.** Top four degrees: $3+3+3+3=12$. Bound: $4\cdot 3 + \min(2,4)+\min(2,4) = 12+2+2=16$. Since $12\leq16$, a graph with exactly this degree sequence really does exist.

**Step 4.** Confirmed: $|E|=8$.

**Step 5 — does the sequence force connectivity?** No. Picture splitting the six vertices into two smaller pieces, each realizing part of the sequence internally, with nothing joining the two pieces — that is a legitimate disconnected graph carrying this exact degree sequence.

**Step 6 — the ceiling on $6$ vertices.** Every pair of vertices can share at most one edge: $\binom{6}{2}=\frac{6\cdot5}{2}=15$, reached only by $K_6$, where every vertex sits at degree $5$.

**Close.** Summing degrees and halving hands you the edge count fast, but connectivity is a fact the sum can never carry — check it separately every time.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Handshaking Lemma on a degree sequence","steps":[{"prompt":"A graph has degree sequence (4, 3, 3, 2, 2). Is this a valid degree sequence? If yes, how many edges does it have?","hint":"Apply the Handshaking Lemma: sum all degrees. If the sum is even, divide by 2 to get the edge count.","answer":"Sum = 4+3+3+2+2 = 14, which is even. So the graph is potentially valid and has 14/2 = 7 edges."},{"prompt":"For the same degree sequence (4, 3, 3, 2, 2), the graph has 5 vertices. What is the maximum possible edges in a simple graph on 5 vertices? Is our edge count consistent?","hint":"Maximum edges in a simple graph on n vertices is C(n,2) = n(n−1)/2. Check if 7 ≤ this maximum.","answer":"Max edges = C(5,2) = 10. Our graph has 7 edges ≤ 10, so it is consistent with being a simple graph."}]}
```
