---
# Alternative body for euler-hamilton.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: euler-hamilton.intuition.shaken
concept_id: euler-hamilton
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: euler-hamilton-intuition
for_stance: shaken
---

Take five vertices $A,B,C,D,E$ with edges $AB, BC, CA, CD, DE, EC$ — two triangles sharing vertex $C$. Each vertex's degree: $A=2$, $B=2$, $C=4$, $D=2$, $E=2$. Every degree is even, and the graph is connected, so an Eulerian circuit exists: a route using every edge exactly once and returning to the start.

Now delete edge $EC$. Degrees become $A=2$, $B=2$, $C=3$, $D=2$, $E=1$. Exactly two vertices — $C$ and $E$ — now have odd degree, and the graph is still connected. That is the condition for an Eulerian path that is not a circuit: it must start at one odd-degree vertex and end at the other, here $C$ to $E$.

Ask a different question of the original six-edge graph: is there a route visiting every vertex exactly once and returning to the start — a Hamiltonian circuit? Vertex $C$ is a cut vertex: deleting it splits the graph into $\{A,B\}$ and $\{D,E\}$. Any cycle through $C$ uses exactly two edges at $C$, which is not enough to enter and leave both halves. So no Hamiltonian circuit exists here — settled by a structural argument, not a count.

That gap is the whole story. Eulerian existence reduces to counting odd-degree vertices, checkable in $O(V+E)$. Hamiltonian existence has no such shortcut — testing it in general is NP-complete, and a graph can fail every known sufficient condition (like Dirac's or Ore's) and still turn out to have a Hamiltonian circuit, or, as here, plainly lack one for a reason those theorems never mention. Hold onto the count: 0 odd vertices, a circuit; exactly 2, a path; anything else, neither.
