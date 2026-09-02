---
id: continuity.mnemonic
concept_id: continuity
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"D-L-M": Defined, Limit, Match.** Three checks, in order. Is $f(a)$ **D**efined? Does the **L**imit exist? Do they **M**atch? All three "yes" is the entire definition of continuity — no shortcut skips a letter.

**Micro-example:** $f(x)=\frac{x^3-1}{x-1}$, $f(1)=5$. D: yes, $f(1)=5$. L: yes, limit is $3$. M: no — $3\neq5$. Fails at M, so not continuous, and specifically removable (since D and L both held).

**Sanity-check reflex:** whenever a discontinuity question feels finished after computing a limit, ask which letter of D-L-M you actually verified last. If it's L, you're one step short of the actual verdict.
