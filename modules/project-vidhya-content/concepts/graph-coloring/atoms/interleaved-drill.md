---
id: graph-coloring.interleaved-drill
concept_id: graph-coloring
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: graph coloring → planar graphs.**

Take the wheel graph $W_5$: a hub vertex joined to every vertex of a 5-cycle rim. $V=6$, $E=10$ (5 rim edges + 5 spokes).

**Question 1 (graph coloring):** What is $\chi(W_5)$?

*Answer:* $4$. The rim is $C_5$, an odd cycle, so it needs 3 colors on its own. The hub is adjacent to every rim vertex, so it cannot reuse any of the 3 rim colors — it needs a 4th. Checked directly: no proper coloring of $W_5$ exists with 3 colors, and one exists with 4.

**Question 2 (planar graphs):** Is $W_5$ planar, and does that fact alone tell you $\chi(W_5)=4$?

*Answer:* Yes, $W_5$ is planar — draw the rim as a pentagon and place the hub inside, connected outward to each corner, with no crossings. Euler's formula holds: $V-E+F=6-10+F=2 \Rightarrow F=6$ (5 triangular faces between adjacent spokes, plus 1 outer pentagonal face). But planarity by itself does **not** tell you $\chi(W_5)=4$ — the Four Color Theorem only guarantees $\chi(G)\leq 4$ for any planar graph. $W_5$ happens to need exactly 4 (Question 1's separate argument), while plenty of other planar graphs (any tree, any bipartite planar graph) need only 2.

**Why this drill exists:** students who learn "planar $\Rightarrow$ four color theorem" often collapse the upper bound into an exact claim, answering "$\chi=4$" for every planar graph without checking, or the opposite error — assuming planarity somehow keeps $\chi(G)$ low and missing that a planar graph can genuinely need all 4 colors. $W_5$ is a real, verified example of the bound being tight, not just a hypothetical.
