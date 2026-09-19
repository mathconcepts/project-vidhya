---
id: binomial-theorem.intuition-assured
concept_id: binomial-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
variant_of: binomial-theorem.intuition
for_stance: assured
---

$T_{r+1} = \binom{n}{r}a^{n-r}b^r$, and the middle-term count follows from parity of $n$ alone. The distinction JEE actually charges marks for: "greatest coefficient" and "greatest term" are NOT the same question, and treating them as one is the single most costly conflation on this topic. Greatest coefficient asks which $\binom{n}{r}$ is biggest — a fact about $n$ alone, always centred, computable without ever touching $a$ or $b$. Greatest term asks which $T_{r+1} = \binom{n}{r}a^{n-r}b^r$ is numerically biggest for SPECIFIC values of $a$ and $b$ — and that peak can sit anywhere, not necessarily near the middle. Counterexample: in $(1+x)^{12}$ with $x=2$, the greatest coefficient is $\binom{12}{6}=924$ at the exact centre, but the greatest TERM (verify: compare consecutive ratios) is actually the 9th term, off-centre, because the growing power of $x=2$ keeps pushing the peak rightward past where the coefficients alone would put it.
