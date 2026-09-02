---
id: discrete-distributions.mnemonic
concept_id: discrete-distributions
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"BINGO" for when Binomial applies:** **B**ernoulli trials, **I**ndependent, **N**umber of trials fixed, **G**onstant probability (constant $p$), **O**utcomes counted (successes). Miss any one letter and it isn't Binomial — no fixed $n$ means Geometric or Poisson; no constant $p$ (finite pool, no replacement) means Hypergeometric.

Worked micro-example: $n=5$, $p=0.3$, all five BINGO letters check out, so $P(X=2)=\binom{5}{2}(0.3)^2(0.7)^3=0.3087$ is the right formula to reach for.

**Sanity-check reflex:** before substituting into any of the four formulas, say the story back in one sentence — "fixed trials, constant p" vs. "rare events, no fixed count" vs. "until first success" vs. "finite pool, no replacement." If the sentence doesn't match the formula you're about to write, stop.
