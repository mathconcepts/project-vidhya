---
id: probability-basics-visual-analogy
concept_id: probability-basics
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# The Bag of Colored Balls

Imagine a bag holding **10 balls**: 4 red, 3 blue, 2 green, 1 yellow.

You reach in blindfolded and pull one out.

## Sample Space = The Whole Bag

$\Omega$ is all 10 balls. Every possible draw lives here.

$$|\Omega| = 10$$

## Events = Subsets of Balls

- Event $R$ = "draw a red ball" $\Rightarrow$ 4 balls satisfy it
- Event $B$ = "draw a blue ball" $\Rightarrow$ 3 balls satisfy it
- Event $\overline{R}$ = "not red" $\Rightarrow$ 6 balls satisfy it

$$P(R) = \frac{4}{10} = 0.4, \qquad P(B) = \frac{3}{10} = 0.3$$

## Union: Red or Blue?

$R$ and $B$ share no balls (mutually exclusive), so:

$$P(R \cup B) = P(R) + P(B) = 0.4 + 0.3 = 0.7$$

Now suppose the bag has balls that can be **both** large and red (3 balls are red, 2 balls are large, 1 ball is both large and red):

$$P(\text{red} \cup \text{large}) = 0.3 + 0.2 - 0.1 = 0.4$$

The subtracted $0.1$ removes the double-counting of the one ball that is both.

## Conditional: Already Know Something

You peek and learn the drawn ball is **not yellow** (9 balls remain in your mental picture). Now:

$$P(R \mid \text{not yellow}) = \frac{4}{9} \approx 0.44$$

The sample space **shrank** from 10 to 9. The red balls (4) didn't change, but the denominator did.

## Independence: Two Separate Bags

Draw one ball from Bag A and one from Bag B. What happens in Bag A has no effect on Bag B — the draws are independent:

$$P(\text{red from A} \cap \text{blue from B}) = P(\text{red from A}) \times P(\text{blue from B})$$

Contrast: drawing **two balls from the same bag without replacement** — the second draw depends on what the first removed.

## Bayes: The Bag You Didn't Pick

Two bags sit on a table. Someone picks a bag at random (50-50) and hands you one ball — it's red.

- Bag 1: 8 red, 2 blue
- Bag 2: 3 red, 7 blue

Which bag was it most likely drawn from? Bayes' theorem computes this:

$$P(\text{Bag 1} \mid \text{red}) = \frac{P(\text{red} \mid \text{Bag 1})\, P(\text{Bag 1})}{P(\text{red})}$$

$$= \frac{0.8 \times 0.5}{0.8 \times 0.5 + 0.3 \times 0.5} = \frac{0.4}{0.55} \approx 0.73$$

The red ball makes Bag 1 more than twice as likely as the prior 50-50 — evidence updated the belief.

**The balls are your data. The events are your questions. Probability is how you count carefully.**
