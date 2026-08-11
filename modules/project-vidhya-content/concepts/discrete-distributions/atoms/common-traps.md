---
id: discrete-distributions.common-traps
concept_id: discrete-distributions
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing Binomial and Poisson**: Binomial requires a **fixed number of trials** $n$, while Poisson models **rare events over an interval** with no fixed $n$. Red flag: if the problem says "in a 5-minute window" or "over a region," it's likely Poisson, not Binomial.
- **Forgetting the binomial coefficient**: Students compute $p^k(1-p)^{n-k}$ but forget to multiply by $\binom{n}{k}$, leading to massive undercounting. The binomial coefficient accounts for different orderings of $k$ successes among $n$ trials.
- **Using binomial when applying Poisson approximation**: When $n$ is large and $p$ is small (e.g., $n = 1000, p = 0.001$), the binomial becomes hard to compute directly. Poisson with $\lambda = np$ is much simpler. But students sometimes force the binomial formula anyway, computing $0.999^{999}$ by hand — impractical.
