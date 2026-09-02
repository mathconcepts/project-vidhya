---
id: hypothesis-testing.exam-pattern
concept_id: hypothesis-testing
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions give you $\bar{x}$, $\mu_0$, and either $\sigma$ or $s$, plus $n$, and ask for the test statistic or the p-value directly.** Example: $n=100$, known $\sigma=15$, $\bar{x}-\mu_0=3$ gives $z=3/(15/\sqrt{100})=3/1.5=2$ — one substitution, no table needed for the statistic itself.

- **MCQ/MSQ "which of these is/isn't true" questions target the error-type and z-vs-t distinctions:**
  - "A Type I error means $H_0$ was actually true" — true.
  - "A smaller $\alpha$ always reduces both types of error" — false; smaller $\alpha$ lowers Type I but raises Type II for fixed $n$.
  - "The $t$-distribution should be used whenever $n<30$" — false; the real trigger is whether $\sigma$ is known, not sample size alone.

- **One-tailed vs two-tailed is a frequent silent switch.** A computed $z=1.5$ falls short of the one-tailed critical value $1.645$ (fail to reject) but the SAME $z=1.5$ would also fall short of the two-tailed critical value $1.96$ — the direction of $H_1$ changes which critical value applies, not just a label. Always re-derive the critical value from the stated $H_1$ direction rather than recalling "1.96" by reflex.

- **Confidence-interval and hypothesis-test questions are often the same computation asked two ways**: if a $(1-\alpha)$ CI for $\mu$ excludes $\mu_0$, a two-tailed test of $H_0:\mu=\mu_0$ at level $\alpha$ rejects — and vice versa. Recognizing this duality skips re-deriving a test statistic when a CI is already given.

- **Time budget:** a single z-test or t-test computation (statistic, critical value, decision) should cost under 90 seconds once the formula is set up; a paired CI-and-test question is worth 2-3 minutes since it reuses the same standard error twice.
