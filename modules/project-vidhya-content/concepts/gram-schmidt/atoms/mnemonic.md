---
id: gram-schmidt.mnemonic
concept_id: gram-schmidt
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Project, then reject."** For each new vector, project it onto every rail already built, then reject (subtract) that projection. What survives is orthogonal to all of them — that two-word pair is the entire algorithm, repeated once per vector.

**Worked in one line:** for $v_2=(2,1)$ against rail $u_1=(1,0)$, project ($c=\tfrac{v_2\cdot u_1}{u_1\cdot u_1}=2$, giving $(2,0)$), then reject ($u_2=(2,1)-(2,0)=(0,1)$). Check: $u_1\cdot u_2=0$.

**Sanity-check reflex:** after building each $u_i$, dot it against every earlier $u_j$. Anything other than $0$ means a projection term was skipped or computed against the wrong (original, not orthogonalized) vector — go back before normalizing anything.
