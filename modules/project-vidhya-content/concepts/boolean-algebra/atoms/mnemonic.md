---
id: boolean-algebra.mnemonic
concept_id: boolean-algebra
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Break the bar, flip the operator"** — De Morgan's law in five words: $\overline{A\cdot B}=A'+B'$ and $\overline{A+B}=A'\cdot B'$. Push the complement bar inside, and AND becomes OR (or vice versa).

**For K-map grouping, remember "powers only, wrap around":** valid group sizes are $1,2,4,8,\dots$ — never $3,5,6,7$ — and the map's edges connect to their opposite edges, so a group can straddle a boundary.

**Sanity-check reflex:** after simplifying, plug in the original minterms and confirm the simplified expression evaluates to $1$ on every one, and to $0$ on at least one minterm just outside the set.
