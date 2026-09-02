---
id: sampling-distributions.mnemonic
concept_id: sampling-distributions
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Know $\sigma$, go $Z$. Guess $\sigma$ (via $s$), go $T$. Chase variance, go $\chi^2$."** Three questions, three families — and the choice depends on what you KNOW and what you're TESTING, never on sample size alone.

**Worked micro-example:** $n=25$, population $\sigma=10$ given directly. Since $\sigma$ is known, standard error $=\sigma/\sqrt{n}=10/5=2$, and any standardized statistic here is $Z$, not $T$ — regardless of $n=25$ being "smallish."

**"Chi-squared eats squares, not means."** If a formula involves $\sum(\text{something})^2$ built from independent standard-normal pieces — like $(n-1)s^2/\sigma^2$ — it's chi-squared territory: inference about spread. If the formula is a mean minus a hypothesized value, divided by a standard error, it's $Z$ or $T$ territory: inference about center.

**Sanity-check reflex:** before computing anything, underline the word in the problem that says what's unknown — "$\sigma$" or "$s$"? — and the word that says what's being tested — "$\mu$" or "variance"? Those two words alone pick the distribution.
