---
id: probability-jee.formal-definition
concept_id: probability-jee
atom_type: formal_definition
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

**Conditional probability**: $P(A|B)=\dfrac{P(A\cap B)}{P(B)}$, defined only when $P(B)>0$.

**Independent events**: $A$ and $B$ are independent exactly when $P(A\cap B)=P(A)\cdot P(B)$, equivalently $P(A|B)=P(A)$.

**Mutually exclusive events**: $A$ and $B$ are mutually exclusive when $P(A\cap B)=0$. If both have nonzero probability, they cannot also be independent.

**Total probability theorem**: if $E_1,E_2,\dots,E_n$ partition the sample space (pairwise mutually exclusive, and together covering every outcome), then $P(A)=\sum_{i=1}^n P(E_i)\,P(A|E_i)$.

**Bayes' theorem**: $P(E_i|A)=\dfrac{P(E_i)\,P(A|E_i)}{\sum_{j=1}^n P(E_j)\,P(A|E_j)}$ — the denominator is exactly the total probability of $A$ from the theorem above.

**Binomial distribution**: for $n$ identical, independent trials, each with the same success probability $p$, the probability of exactly $r$ successes is $P(X=r)=\binom{n}{r}p^r(1-p)^{n-r}$, for $r=0,1,\dots,n$.
