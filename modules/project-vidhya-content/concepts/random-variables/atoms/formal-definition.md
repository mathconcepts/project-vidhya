---
id: random-variables.formal-definition
concept_id: random-variables
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Random Variable (RV)**: A function that assigns a real number to each outcome in a sample space.
$$X: S \to \mathbb{R}$$

Given a random experiment with sample space $S$, a random variable $X$ maps each outcome $\omega \in S$ to a real number $X(\omega)$.

**Discrete Random Variable**: Takes on a countable (finite or infinite) set of values. Example: number of heads in 5 coin flips, $X \in \{0, 1, 2, 3, 4, 5\}$.

**Continuous Random Variable**: Takes on any value in an interval or the entire real line. Example: the lifetime of a light bulb, $X \in [0, \infty)$.

**Probability Mass Function (PMF)** for discrete $X$:
$$p(x) = P(X = x), \quad \sum_x p(x) = 1$$

**Probability Density Function (PDF)** for continuous $X$:
$$f(x) \ge 0, \quad \int_{-\infty}^{\infty} f(x) \, dx = 1$$

**Cumulative Distribution Function (CDF)** for any $X$:
$$F(x) = P(X \le x)$$

Geometric interpretation: the PMF assigns probability "masses" at discrete points, summing to 1. The PDF spreads probability over a continuum — the area under the curve equals 1. The CDF accumulates probability from left to right, always starting at 0 and ending at 1.
