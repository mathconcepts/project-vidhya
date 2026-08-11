# Probability Basics

> GATE Engineering Mathematics | Probability & Statistics | high frequency | difficulty: 0.3

## Intuition First
Rolling a die: you can't predict the exact outcome, but you know each face has an equal 1-in-6 chance. Probability quantifies this uncertainty as a number between 0 and 1 — closer to 0 means unlikely, closer to 1 means likely.

## Core Definition

**Probability of an Event**: The ratio of favorable outcomes to total equally-likely outcomes in a sample space.
$$P(A) = \frac{\text{Number of favorable outcomes}}{\text{Total number of possible outcomes}} = \frac{|A|}{|S|}$$

**Sample Space ($S$)**: The set of all possible outcomes of a random experiment.

**Event ($A$)**: A subset of the sample space — one or more outcomes of interest.

**Classical Probability Axioms**:
1. $0 \le P(A) \le 1$ for any event $A$ (probability is bounded).
2. $P(S) = 1$ (the entire sample space has probability 1).
3. For mutually exclusive events $A$ and $B$: $P(A \cup B) = P(A) + P(B)$ (addition rule).
4. $P(A^c) = 1 - P(A)$ (complement rule).

Geometric interpretation: probability is the proportion of favorable outcomes in the sample space. If the sample space has 100 equally likely elements and event $A$ contains 30 of them, then $P(A) = 0.3$ — imagine a dartboard where 30% of the area is shaded as favorable.

## What Happens (Worked Example)

Label: "**What happens:**"

**Problem**: A dice is rolled. Find (a) the probability of rolling an even number, and (b) the probability of rolling a number greater than 4.

**(a) Probability of an even number:**

Sample space: $S = \{1, 2, 3, 4, 5, 6\}$, so $|S| = 6$.

Favorable outcomes (even): $A = \{2, 4, 6\}$, so $|A| = 3$.

$$P(\text{even}) = \frac{|A|}{|S|} = \frac{3}{6} = \frac{1}{2} = 0.5$$

**(b) Probability of rolling > 4:**

Favorable outcomes: $B = \{5, 6\}$, so $|B| = 2$.

$$P(\text{greater than 4}) = \frac{|B|}{|S|} = \frac{2}{6} = \frac{1}{3} \approx 0.333$$

Label: "**Why it works:**"

A fair die has 6 equally likely outcomes. The ratio of favorable outcomes to total outcomes gives the probability. This works because each face occupies an equal 1/6 "share" of the probability pie, and each favorable outcome contributes 1/6 to the total probability of the event. The geometric meaning: if we played this experiment infinitely many times, the proportion of rolls showing an even number approaches 1/2.

## GATE MA Relevance
> **Why it matters in GATE MA:** Probability basics appear in ~20% of probability & statistics questions. GATE tests conceptual understanding via "find P(A)," "find P(not A)," and "find P(A or B)" MCQs and NATs. Weak foundation here cascades into errors in conditional probability, Bayes' theorem, and distribution problems. This is the gateway to advanced probability topics.
