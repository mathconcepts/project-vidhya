---
# Alternative body for euler-hamilton.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: euler-hamilton.worked-example.shaken
concept_id: euler-hamilton
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: euler-hamilton-worked-example
for_stance: shaken
---

**Setup.** $K_4$ has vertices $\{1,2,3,4\}$ and every pair joined: 6 edges total.

**Step 1 — degree of each vertex.** Vertex $1$ connects to $2,3,4$: degree $3$. By symmetry every vertex has degree $3$.

**Step 2 — Eulerian circuit?** Condition: connected and every degree even. $K_4$ is connected, but every vertex has degree $3$, which is odd. All four vertices are odd. No Eulerian circuit.

**Step 3 — Eulerian path (not a circuit)?** Condition: connected and exactly two vertices of odd degree. Here all four vertices are odd — four, not two. No Eulerian path either.

**Step 4 — a Hamiltonian circuit.** Visit every vertex once and return: $1\to2\to3\to4\to1$. Check each edge used: $\{1,2\},\{2,3\},\{3,4\},\{4,1\}$ — all four are edges of $K_4$. Valid Hamiltonian circuit.

**Step 5 — for which $n$ does $K_n$ have an Eulerian circuit?** Every vertex of $K_n$ has degree $n-1$. Even degree needs $n-1$ even, i.e. $n$ odd. Direct count as a check: $n=3$ gives degree $2$ (even, works); $n=4$ gives degree $3$ (odd, fails) — matches what Steps 2–3 just found for $K_4$. So $K_n$ has an Eulerian circuit exactly when $n$ is odd.

**Hold onto this.** Euler asked of edges, Hamilton asked of vertices, and only one of those questions is a degree count.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Eulerian circuit and path conditions from vertex degrees","steps":[{"prompt":"Consider a graph with 6 vertices where vertex degrees are (4, 4, 3, 3, 2, 2). Does an Eulerian circuit exist? Does an Eulerian path exist?","hint":"Count the number of odd-degree vertices. Euler circuit needs 0 odd; Euler path needs exactly 2 odd.","answer":"Odd-degree vertices: degree 3, 3 — exactly 2 odd-degree vertices. So no Eulerian circuit (need 0 odd), but an Eulerian path exists (exactly 2 odd). The path starts at one degree-3 vertex and ends at the other."},{"prompt":"Does K₅ have an Eulerian circuit? Apply the rule derived in Part (e).","hint":"In K_n, every vertex has degree n−1. Check whether n−1 is even for n=5.","answer":"K₅ has n=5 (odd), so degree = 5−1 = 4 (even). All vertices have even degree and K₅ is connected, so yes — K₅ has an Eulerian circuit."}]}
```
