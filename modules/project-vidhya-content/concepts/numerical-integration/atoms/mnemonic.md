---
id: numerical-integration.mnemonic
concept_id: numerical-integration
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**The dinner-table weights.** Seat the nodes around a table: the two guests at the ends (the endpoints) each get exactly **one** share; every other seat alternates **four, two, four, two, …** — odd-numbered interior seats get four shares, even-numbered ones get two. That seating chart *is* Simpson's 1/3 rule, $\frac{h}{3}[1,4,2,4,\dots,4,1]$.

**Worked check:** five nodes ($n=4$) seat as $1,4,2,4,1$ — sum of weights $=12$, and $12\times\frac{h}{3}=12\times\frac{0.25}{3}=1$, exactly the width of $[0,1]$: a constant function $f\equiv1$ must integrate to exactly $1$ under this rule, and it does.

**Sanity-check reflex:** before trusting a Simpson estimate, add up the bracket's weights and multiply by $h/3$ — the result must equal $b-a$ exactly, since the rule is built to integrate $f\equiv1$ perfectly.
