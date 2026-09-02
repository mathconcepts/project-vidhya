---
# Alternative body for series.intuition, served when the learner stance is
# `assured`. Assumes the partial-sums framing; spends words on the
# distinction that costs marks.
id: series.intuition.assured
concept_id: series
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: series.intuition
for_stance: assured
---

The distinction worth the marks: **absolute** and **conditional** convergence are not the same fate wearing different names. $\sum a_n$ converges absolutely when $\sum |a_n|$ itself converges — a strictly stronger claim. $\sum \dfrac{(-1)^{n+1}}{n}$ converges (alternating, decreasing terms $\to 0$: the Leibniz test applies), but $\sum \dfrac1n$ diverges, so this series is convergent only **conditionally** — the sign alternation is doing real work, not decoration.

Why it matters beyond terminology: a conditionally convergent series can be reordered to sum to a *different* value, or to diverge entirely (Riemann rearrangement) — a manipulation that's completely safe for an absolutely convergent series. Treating "converges" as one undifferentiated fact, without asking *which* kind, is where GATE-level series questions quietly separate correct answers from confident-but-wrong ones.
