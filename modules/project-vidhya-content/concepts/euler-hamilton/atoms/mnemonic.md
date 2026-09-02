---
id: euler-hamilton.mnemonic
concept_id: euler-hamilton
atom_type: mnemonic
bloom_level: 2
difficulty: 0.50
exam_ids: ["*"]
modality: mnemonic
---

**The doorway rule: every room you pass through needs a way in and a way out.** Treat each vertex as a room and each edge as a doorway. Walking a tour, you use doorways in pairs at every room except possibly where you start and where you end. So: $0$ odd-degree rooms means every room pairs up perfectly — a full round-trip tour exists (a circuit). Exactly $2$ odd-degree rooms means those two are your start and end (a path, not a circuit). Anything else — no tour, full stop.

**Worked micro-example:** two triangles sharing one vertex $C$ — triangle $ABC$ and triangle $CDE$. Degrees: $\deg(A)=\deg(B)=\deg(D)=\deg(E)=2$, $\deg(C)=4$. All five are even, so $0$ odd-degree rooms — an Eulerian circuit exists, even though $C$ gets visited twice along the way (once per triangle), since its four doorways still pair up cleanly.

**Sanity-check reflex:** count odd-degree vertices before attempting to trace anything. $0$ or $2$ and connected — a tour exists, go find it. Any other count — don't waste time hunting for a tour that provably can't exist.
