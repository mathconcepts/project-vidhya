---
id: euler-hamilton.interleaved-drill
concept_id: euler-hamilton
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: euler-hamilton → graph connectivity.**

Take vertices $\{A,B,C,D,E\}$ with edges $\{AB, BC, CD, DA, AC, DE\}$ — a 4-cycle $ABCD$ with diagonal $AC$, plus a pendant edge $DE$ hanging off $D$.

**Question 1 (graph connectivity):** Is $D$ a cut vertex?

*Answer:* Yes. Removing $D$ deletes edges $CD$, $DA$, and $DE$, leaving edges $AB$, $BC$, $AC$ among $\{A,B,C\}$ (still fully joined) but stranding $E$, whose only edge was $DE$. The graph splits into $\{A,B,C\}$ and $\{E\}$ — two components, so $\kappa(G)=1$.

**Question 2 (euler-hamilton):** Does this graph have an Eulerian circuit or path?

*Answer:* Neither. Degrees: $\deg(A)=3$, $\deg(B)=2$, $\deg(C)=3$, $\deg(D)=3$, $\deg(E)=1$ — four odd-degree vertices ($A,C,D,E$), not $0$ or $2$. No Eulerian tour of any kind exists here, regardless of how the graph is connected.

**Why this drill exists:** having a cut vertex feels like it should be the reason a tour fails — the graph "barely holds together," so surely nothing can traverse it cleanly. But Euler existence is decided purely by degree parity, not by structural fragility: this same graph could have zero cut vertices and still fail the Euler test on a different edge set, and the two-triangle bowtie graph from the mnemonic atom has a cut vertex ($C$) yet **does** have an Eulerian circuit. Connectivity structure and degree parity are independent checks — neither predicts the other.
