---
id: discrete-distributions.exam-pattern
concept_id: discrete-distributions
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions typically hand you $n$ and $p$ (or $\lambda$) and ask for one specific $P(X=k)$, or $E[X]$/$\text{Var}(X)$.** Recognize the story before reaching for a formula — "fixed trials" vs. "rare events over time" vs. "until first success" vs. "finite pool, no replacement" each point to a different one of the four.

  Example: $n=5$, $p=0.3$, $P(X=2) = \binom{5}{2}(0.3)^2(0.7)^3 = 0.3087$.

- **MCQ "which distribution applies" questions describe a sampling scenario in words** and expect you to name Binomial/Poisson/Geometric/Hypergeometric without computing anything — the words "without replacement" or "finite batch" are the strongest signal for Hypergeometric specifically.

- **MSQ questions test mean/variance formulas across the four distributions simultaneously** — $np$ vs. $\lambda$ vs. $1/p$ vs. the Hypergeometric mean $n\cdot K/N$ are easy to swap under pressure.

- **Time budget:** a single Binomial or Poisson probability with small $n$ or $k$ should take under 90 seconds; if you're still expanding factorials past two minutes, double-check you haven't misidentified which of the four distributions actually applies.
