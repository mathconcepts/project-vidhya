---
id: discrete-distributions.intuition
concept_id: discrete-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

Binomial counts successes across a *fixed number* of independent trials, each with the *same* success probability — flip a coin 10 times, count heads. Every trial resets; the coin doesn't remember previous flips.

Poisson counts events in a fixed window of time or space when those events happen rarely and independently — calls per minute, typos per page. It's what Binomial becomes when $n$ grows very large and $p$ shrinks proportionally, keeping $np=\lambda$ fixed: infinitely many "trials," each individually almost certain to fail.

Geometric counts *how many trials until the first success* — keep flipping until the first head. Unlike Binomial, the number of trials isn't fixed; it's the random quantity.

Hypergeometric is Binomial's cousin for finite populations sampled *without* replacement: draw 5 cards from a deck and count aces, and each card drawn changes the composition of what's left. The success probability shifts trial to trial — the one assumption Binomial can't tolerate.
