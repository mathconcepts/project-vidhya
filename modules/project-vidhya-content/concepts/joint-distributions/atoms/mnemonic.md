---
id: joint-distributions.mnemonic
concept_id: joint-distributions
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Sum away what you don't want."** To get the marginal of $X$ from a joint table, sum (or integrate) *over every value of $Y$* — you are throwing $Y$'s information away on purpose, row by row.

**Worked micro-example:** joint PMF $p(0,0)=0.3,\ p(0,1)=0.2,\ p(1,0)=0.1,\ p(1,1)=0.4$. Want $P(X=0)$: sum the row where $X=0$, ignoring which $Y$ value: $0.3+0.2=0.5$.

**The independence reflex — factor AND fence.** Two checks, both required: (1) does the joint **factor**, $p(x,y)=p_X(x)p_Y(y)$, at every cell? (2) is the **support a rectangle**, not a shape like $0<x<y<1$ where one variable's range depends on the other? A "yes" to the factoring question on a non-rectangular support is impossible — check the fence first, it's faster.

**Sanity-check reflex:** after computing any marginal row or column, add every marginal you found. They must sum to exactly $1$. If they don't, a cell was mis-copied or double-counted.
