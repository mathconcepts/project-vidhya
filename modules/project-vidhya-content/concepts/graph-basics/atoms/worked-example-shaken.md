---
# Alternative body for graph-basics.worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
id: graph-basics.worked-example.shaken
concept_id: graph-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: graph-basics.worked-example
for_stance: shaken
---

**Problem:** Graph $G$ on $\{A,B,C,D,E\}$ with edges $\{AB,AC,AD,BC,BD,CE\}$.

---

**Step 1 — Count edges touching each vertex.**

$A$ appears in $AB,AC,AD$: 3 edges. $B$ appears in $AB,BC,BD$: 3 edges. $C$ appears in $AC,BC,CE$: 3 edges. $D$ appears in $AD,BD$: 2 edges. $E$ appears in $CE$: 1 edge.

---

**Step 2 — Add the five numbers.**

$3+3+3+2+1=12$.

---

**Step 3 — Count the edges directly from the list.**

$AB,AC,AD,BC,BD,CE$ — 6 edges. Double it: $2\times6=12$.

---

**Step 4 — Check the two numbers match.**

$12=12$ ✓. The tallies in Step 1 were correct.

$$\boxed{\sum\deg(v)=12=2|E|}$$

Odd-degree vertices: $A,B,C,E$ — four, an even number.
