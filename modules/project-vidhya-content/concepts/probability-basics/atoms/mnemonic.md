---
id: probability-basics.mnemonic
concept_id: probability-basics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"PLEB" gives you the shape of Bayes' theorem:** Prior times Likelihood, over Evidence, gives you the posterior — the thing you're actually after (a **B**elief, updated).

$$P(A\mid B) = \frac{\overbrace{P(A)}^{\text{prior}}\cdot\overbrace{P(B\mid A)}^{\text{likelihood}}}{\underbrace{P(B)}_{\text{evidence}}}$$

Worked micro-example: prior $P(D)=0.01$, likelihood $P(\text{pos}\mid D)=0.99$, evidence $P(\text{pos})=0.0594$ (computed from total probability, never guessed). $0.01\times0.99/0.0594 = 1/6$.

**Sanity-check reflex:** the posterior should always sit *between* the prior and 1 (unless the evidence is impossible) — if your Bayes' answer comes out smaller than the prior you started with, you divided by the wrong probability.
