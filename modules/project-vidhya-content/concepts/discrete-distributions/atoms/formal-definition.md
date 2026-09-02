---
id: discrete-distributions.formal-definition
concept_id: discrete-distributions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Binomial:** $P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}$, $k=0,\dots,n$; fixed $n$ trials, constant $p$, with replacement (or infinite population).

**Poisson:** $P(X=k)=\dfrac{e^{-\lambda}\lambda^k}{k!}$, $k=0,1,2,\dots$; rate $\lambda$ over a fixed interval.

**Geometric:** $P(X=k)=(1-p)^{k-1}p$, $k=1,2,\dots$; trials until first success.

**Hypergeometric:** $P(X=k)=\dfrac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}$; sampling $n$ without replacement from a finite population of $N$ with $K$ successes.

Use Binomial when success probability stays fixed across trials; switch to Hypergeometric the moment sampling is without replacement from a finite, non-huge population — the tempting shortcut is applying Binomial there anyway because the setup "looks the same" (fixed number of draws, counting successes), which ignores that each draw changes the remaining population's composition.
