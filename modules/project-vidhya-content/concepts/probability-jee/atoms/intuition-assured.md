---
id: probability-jee.intuition-assured
concept_id: probability-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
variant_of: probability-jee.intuition
for_stance: assured
---

The binomial formula $P(X=r)=\binom{n}{r}p^r(1-p)^{n-r}$ needs $n$ IDENTICAL, INDEPENDENT trials with the same success probability $p$ throughout — a condition that "$n$ repeated draws" alone does not guarantee, and JEE exploits exactly that gap.

Drawing a card, checking its suit, and putting it back before the next draw keeps $p$ fixed every time — genuinely binomial. Drawing $5$ cards from a deck WITHOUT replacement, asking for the probability of exactly $3$ hearts, changes the deck's composition after every draw: $p$ starts at $13/52$ but shifts depending on what was already drawn, so the trials are neither identical nor independent. The formula still computes a number if you plug it in, but that number answers a different, wrong question — the correct tool there is the hypergeometric distribution, not binomial, and recognising which situation you are in is the actual skill being tested, not the arithmetic.
