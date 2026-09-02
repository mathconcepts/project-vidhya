---
id: graph-basics.mnemonic
concept_id: graph-basics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Every edge is a handshake."** A handshake always involves exactly two hands — never one, never three. That's the whole handshaking lemma: every edge contributes exactly 2 to the total degree count, once for each endpoint it touches.

**Worked micro-example:** four people at a small gathering shake hands 5 times total (5 edges). Total hands shaken across everyone: $5\times2=10$. If someone tallies the degrees at the end and gets $9$ or $11$, somebody miscounted a handshake — the total must land on an even number, full stop.

**Sanity-check reflex:** after tallying any degree sequence, add it up. Odd total? Recount — an error was made, because no real graph can produce it. Even total that doesn't match $2\times(\text{edges you counted})$? Also recount; the two numbers must agree exactly.
