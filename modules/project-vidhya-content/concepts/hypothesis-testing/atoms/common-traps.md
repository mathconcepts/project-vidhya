---
id: hypothesis-testing.common-traps
concept_id: hypothesis-testing
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Misinterpreting the p-value as "probability $H_0$ is true"**: The p-value is the conditional probability of the data **given** $H_0$, not the probability of $H_0$ being true. A small p-value suggests $H_0$ is implausible, but it's not a direct statement about $H_0$'s truth.
- **Confusing Type I and Type II errors**: Type I (false positive, $\alpha$) is rejecting a true $H_0$. Type II (false negative, $\beta$) is failing to reject a false $H_0$. The mnemonics: Type I = "Boy who cried wolf" (false alarm), Type II = "Missing the wolf" (missed detection).
- **Using wrong test statistic (z vs t)**: Students use $z$-test (normal distribution) when $\sigma$ is unknown and should use $t$-test instead. Red flag: if the problem says "sample SD" or $s$ instead of population SD $\sigma$, it's a $t$-test. Also, for large samples ($n > 30$), the $t$-test approximates the $z$-test, so either may be acceptable (but $t$ is more conservative and preferred).
