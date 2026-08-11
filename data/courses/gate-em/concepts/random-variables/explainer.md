# Random Variables

> GATE Engineering Mathematics | Probability & Statistics | high frequency | difficulty: 0.4

## Intuition First
A random variable is like a "translator" that converts unpredictable outcomes into numbers. When you roll a die, the outcome is either 1, 2, 3, 4, 5, or 6 (a random variable $X$). Or count how many heads appear in 10 coin flips — that count is also a random variable, taking values 0 through 10.

## Core Definition

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

## What Happens (Worked Example)

Label: "**What happens:**"

**Problem**: Toss a fair coin twice. Let $X$ = number of heads. Find the PMF and CDF.

**Sample space**: $S = \{TT, TH, HT, HH\}$, each with probability $1/4$.

**Values of $X$**:
- $X = 0$ when outcome is $TT$ → $P(X = 0) = 1/4$
- $X = 1$ when outcome is $TH$ or $HT$ → $P(X = 1) = 2/4 = 1/2$
- $X = 2$ when outcome is $HH$ → $P(X = 2) = 1/4$

**PMF**:
$$p(x) = \begin{cases} 1/4 & \text{if } x = 0 \\ 1/2 & \text{if } x = 1 \\ 1/4 & \text{if } x = 2 \\ 0 & \text{otherwise} \end{cases}$$

**CDF**:
$$F(x) = \begin{cases} 0 & \text{if } x < 0 \\ 1/4 & \text{if } 0 \le x < 1 \\ 3/4 & \text{if } 1 \le x < 2 \\ 1 & \text{if } x \ge 2 \end{cases}$$

Note: $F(0) = P(X \le 0) = P(X = 0) = 1/4$; $F(1) = P(X \le 1) = P(X = 0) + P(X = 1) = 1/4 + 1/2 = 3/4$.

Label: "**Why it works:**"

The random variable $X$ is the count of heads. Each of the 4 equally-likely outcomes maps to a specific value of $X$. The PMF collects these outcomes by their mapped value; the CDF accumulates probabilities as we move rightward along the number line. This transforms an abstract sample space into concrete numerical data we can compute with.

## GATE MA Relevance
> **Why it matters in GATE MA:** Random variables are the bridge from probability (events) to statistics (data). ~15% of GATE questions ask for the PMF, CDF, or expected value of a defined random variable. GATE tests both discrete cases (binomial, Poisson) and continuous cases (normal, exponential), with emphasis on recognizing when to apply which distribution.
