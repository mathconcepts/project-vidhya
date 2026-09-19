---
id: sets-relations-functions.retrieval-prompt
concept_id: sets-relations-functions
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.25
estimated_minutes: 1
exam_ids: ["*"]
---

**Question:** State the three conditions a relation must satisfy to be an equivalence relation. Then state the one condition a function $f$ must satisfy for its inverse $f^{-1}$ to exist.

<details>
<summary>Answer</summary>

**Equivalence relation** — a relation $R$ on a set must be:
1. **Reflexive**: $(a,a) \in R$ for every element $a$.
2. **Symmetric**: $(a,b) \in R \Rightarrow (b,a) \in R$.
3. **Transitive**: $(a,b) \in R$ and $(b,c) \in R \Rightarrow (a,c) \in R$.

All three, together — any two alone are not enough.

**Inverse function** — $f^{-1}$ exists if and only if $f$ is **bijective**: one-one (distinct inputs give distinct outputs) **and** onto (every element of the codomain is actually hit). A function that is only one-one, or only onto, does not have a genuine inverse.

</details>
