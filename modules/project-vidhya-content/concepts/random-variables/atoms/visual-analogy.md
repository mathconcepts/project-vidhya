---
id: random-variables-visual-analogy
concept_id: random-variables
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# A Die Is a Random Variable

Roll a fair six-sided die. The **outcome** is one of $\{1, 2, 3, 4, 5, 6\}$ — but the random variable $X$ is just the number shown. That mapping (outcome $\to$ number) is all a random variable is.

## The PMF as a Spike Chart

Each face has probability $\frac{1}{6}$, so the PMF looks like six equal spikes:

$$p(k) = P(X = k) = \frac{1}{6}, \quad k \in \{1,2,3,4,5,6\}$$

If you weighted the die so face-6 appeared twice as often:

$$p(6) = \frac{2}{7}, \quad p(k) = \frac{1}{7} \text{ for } k \neq 6$$

The spikes change height — but they must still sum to 1 (all possible values accounted for).

## Expected Value as the Balance Point

Imagine placing the spike chart on a see-saw. $E[X]$ is exactly the fulcrum that keeps it balanced:

$$E[X] = 1 \cdot \frac{1}{6} + 2 \cdot \frac{1}{6} + \cdots + 6 \cdot \frac{1}{6} = \frac{21}{6} = 3.5$$

The die never shows 3.5 — $E[X]$ is the long-run average over many rolls, not a possible value.

## Variance as Spread from the Pivot

Some dice are clustered near the center (low variance); others spread to extremes (high variance).

$$E[X^2] = 1^2 \cdot \frac{1}{6} + \cdots + 6^2 \cdot \frac{1}{6} = \frac{91}{6} \approx 15.17$$

$$\text{Var}(X) = E[X^2] - (E[X])^2 = \frac{91}{6} - \left(\frac{7}{2}\right)^2 = \frac{91}{6} - \frac{49}{4} = \frac{35}{12} \approx 2.92$$

## Binomial: Counting Successes Across Many Rolls

Roll the die 10 times. Let $Y$ = "number of sixes." Each roll is a Bernoulli trial with $p = \frac{1}{6}$:

$$Y \sim B\!\left(10,\, \frac{1}{6}\right)$$

$$E[Y] = np = \frac{10}{6} \approx 1.67, \qquad \text{Var}(Y) = np(1-p) = 10 \cdot \frac{1}{6} \cdot \frac{5}{6} \approx 1.39$$

## Poisson: Rare Events per Unit Time

Rare accidents at a factory — 2 per hour on average. Roll the clock instead of a die: $\lambda = 2$, and:

$$P(X = k) = \frac{e^{-2} \cdot 2^k}{k!}$$

The Poisson distribution is the Binomial with the die replaced by a very fine-grained clock (many tiny time slots, tiny probability of an event per slot, fixed average rate).

## CDF as the Staircase

The CDF $F(x) = P(X \leq x)$ for the fair die is a staircase: it jumps by $\frac{1}{6}$ at each integer 1 through 6, and stays flat between jumps. For continuous distributions, the staircase melts into a smooth ramp — which is the integral of the PDF.

**Every distribution is just an answer to: "how is probability distributed across possible values?"**
