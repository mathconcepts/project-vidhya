---
id: random-variables.mnemonic
concept_id: random-variables
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"SAM": Square After Mean.** To get variance, take the expectation of $X^2$ first, THEN subtract the *square* of $E[X]$ — never square the deviations before averaging in your head and never average before squaring the mean. $\text{Var}(X)=E[X^2]-(E[X])^2$.

Worked micro-example: PMF weights $0.2,0.3,0.5$ on $X=1,2,3$. $E[X^2]=1(0.2)+4(0.3)+9(0.5)=5.9$. $E[X]=2.3$, so $(E[X])^2=5.29$. $\text{Var}(X)=5.9-5.29=0.61$.

**Sanity-check reflex:** $E[X^2]$ must always be at least $(E[X])^2$ — if subtracting gives a negative number, the PMF sum or one of the two expectations was computed wrong; recheck both before trusting the variance.
