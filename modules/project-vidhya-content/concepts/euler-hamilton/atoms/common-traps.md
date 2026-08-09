---
id: euler-hamilton.common-traps
concept_id: euler-hamilton
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing Eulerian with Hamiltonian**: Eulerian = visits every **edge** once. Hamiltonian = visits every **vertex** once. Students mix these up constantly. A mnemonic: **E**ulerian → **E**dges, **H**amiltonian → **H**ow many (vertices).
- **Forgetting the "exactly 2" rule for Eulerian paths**: Students remember "all even = Eulerian circuit" but forget that "exactly 2 odd = Eulerian path (not circuit)." They think "odd degrees = no Eulerian anything," which is wrong.
- **Overconfidence in Dirac's Theorem**: Dirac's theorem is a *sufficient* condition, not necessary. Just because a graph doesn't satisfy Dirac doesn't mean no Hamiltonian circuit exists. GATE tests this: it gives a degree sequence that fails Dirac and asks if a Hamiltonian path CAN exist (yes, but we'd need to check other methods or the structure).
