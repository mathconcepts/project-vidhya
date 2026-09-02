---
id: vector-algebra-basics.mnemonic
concept_id: vector-algebra-basics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Dot goes with cos, cross goes with sin."** Say the pairing once and the two magnitude formulas $|\vec a\cdot\vec b|=|\vec a||\vec b|\cos\theta$ and $|\vec a\times\vec b|=|\vec a||\vec b|\sin\theta$ stop swapping under pressure — dot shrinks toward zero as two vectors turn perpendicular ($\cos90^\circ=0$), cross grows toward its maximum there ($\sin90^\circ=1$).

**Worked micro-example.** For $\vec a=(1,0,0)$ and $\vec b=(0,1,0)$ (perpendicular): $\vec a\cdot\vec b=0$ and $\vec a\times\vec b=(0,0,1)$, magnitude $1$ — dot at its minimum, cross at its maximum, exactly as the rhyme predicts.

**Sanity-check reflex:** check the output's *type* before checking its value — dot and the scalar triple product return a plain number, cross returns a vector. A vector sitting where a number was asked for (or the reverse) means the wrong product was reached for, not that the arithmetic slipped.
