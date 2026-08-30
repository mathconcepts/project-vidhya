---
# Alternative body for euler-hamilton.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: euler-hamilton.worked-example.assured
concept_id: euler-hamilton
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: euler-hamilton-worked-example
for_stance: assured
---

$K_4$: every vertex has degree $n-1=3$ (odd), so no Eulerian circuit or path — the shortcut (parity of $n-1$) already tells you $K_n$ has an Eulerian circuit iff $n$ is odd, and $4$ isn't. A Hamiltonian circuit exists regardless: $1\to2\to3\to4\to1$, since $K_n$ is Hamiltonian for every $n\geq 3$ — degree alone never obstructs it here, because every vertex is adjacent to every other.

The shortcut you're using — $\deg(v)=n-1$ even $\iff$ Eulerian circuit — checks a necessary and sufficient condition for $K_n$ specifically, precisely because $K_n$'s degree sequence is constant; for a general graph the same parity count is still iff, but you'd need every vertex's individual degree, not one formula. Don't confuse that with Dirac's or Ore's bounds on Hamiltonian circuits, which are sufficient only — $K_n$ happens to always satisfy them trivially ($\delta=n-1\geq n/2$ for $n\geq2$), which is why $K_n$ being Hamiltonian was never in doubt.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Eulerian circuit and path conditions from vertex degrees","steps":[{"prompt":"Consider a graph with 6 vertices where vertex degrees are (4, 4, 3, 3, 2, 2). Does an Eulerian circuit exist? Does an Eulerian path exist?","hint":"Count the number of odd-degree vertices. Euler circuit needs 0 odd; Euler path needs exactly 2 odd.","answer":"Odd-degree vertices: degree 3, 3 — exactly 2 odd-degree vertices. So no Eulerian circuit (need 0 odd), but an Eulerian path exists (exactly 2 odd). The path starts at one degree-3 vertex and ends at the other."},{"prompt":"Does K₅ have an Eulerian circuit? Apply the rule derived in Part (e).","hint":"In K_n, every vertex has degree n−1. Check whether n−1 is even for n=5.","answer":"K₅ has n=5 (odd), so degree = 5−1 = 4 (even). All vertices have even degree and K₅ is connected, so yes — K₅ has an Eulerian circuit."}]}
```
