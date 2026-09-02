---
id: graph-basics.worked-example
concept_id: graph-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A graph $G$ has vertex set $\{A,B,C,D,E\}$ and edge set $\{AB, AC, AD, BC, BD, CE\}$. Verify the handshaking lemma on $G$ and confirm the odd-degree-vertex corollary.

---

**Step 1 — Tally each vertex's degree directly from the edge list.**

$A$ appears in $AB, AC, AD$ $\Rightarrow$ $\deg(A)=3$. $B$ appears in $AB, BC, BD$ $\Rightarrow$ $\deg(B)=3$. $C$ appears in $AC, BC, CE$ $\Rightarrow$ $\deg(C)=3$. $D$ appears in $AD, BD$ $\Rightarrow$ $\deg(D)=2$. $E$ appears in $CE$ $\Rightarrow$ $\deg(E)=1$.

---

**Step 2 — Sum the degrees.**

$3+3+3+2+1=12$.

---

**Step 3 — Compare against $2|E|$.**

$G$ has 6 edges, so $2|E|=12$. The two numbers match: $12=12$ ✓.

---

**Step 4 — Apply the corollary.**

Odd-degree vertices here: $A(3), B(3), C(3), E(1)$ — four of them. Four is even, exactly as the corollary demands (an odd count of odd terms would force an odd sum, contradicting Step 3).

$$\boxed{\sum\deg(v)=12=2|E|,\quad 4\text{ odd-degree vertices (even, as required)}}$$

**Sanity check:** if any single tally in Step 1 were off by one, Step 3's equality would break immediately — the handshaking lemma is a built-in arithmetic check on your own edge-counting, not just a theorem to quote.
