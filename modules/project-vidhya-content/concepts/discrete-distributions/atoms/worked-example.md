---
id: discrete-distributions.worked-example
concept_id: discrete-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Worked Example: Defect Inspection (Binomial)

### Problem

A manufacturing facility inspects items for defects. Historical data shows a 15% defect rate. An inspector randomly selects 8 items from the production line.

(a) Find the probability of observing exactly 2 defective items.
(b) Find the probability of observing at most 1 defective item.

### Solution

**This is a binomial scenario:** $n = 8$ trials, $p = 0.15$ (defect probability), $X$ = number of defects.

The binomial probability mass function is:
$$P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}$$

#### Part (a): Exactly 2 defects

$$P(X = 2) = \binom{8}{2} (0.15)^2 (0.85)^6$$

Calculate each component:
- $\binom{8}{2} = \frac{8!}{2! \cdot 6!} = \frac{8 \times 7}{2} = 28$
- $(0.15)^2 = 0.0225$
- $(0.85)^6 = 0.37649$

$$P(X = 2) = 28 \times 0.0225 \times 0.37649 = 0.2376$$

**Answer: ≈ 0.238 or 23.8%**

#### Part (b): At most 1 defect

$$P(X \leq 1) = P(X = 0) + P(X = 1)$$

**For $X = 0$:**
$$P(X = 0) = \binom{8}{0} (0.15)^0 (0.85)^8 = 1 \times 1 \times 0.27249 = 0.27249$$

**For $X = 1$:**
$$P(X = 1) = \binom{8}{1} (0.15)^1 (0.85)^7 = 8 \times 0.15 \times 0.32010 = 0.38412$$

$$P(X \leq 1) = 0.27249 + 0.38412 = 0.65661$$

**Answer: ≈ 0.657 or 65.7%**

### Key Exam Insight

Binomial problems ask: **"In a fixed number of independent trials, each with constant probability of success, what's the probability of exactly $k$ (or at most $k$) successes?"** Recognize this story, apply the formula, and calculate carefully.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Defect Inspection Problem","steps":[{"prompt":"Step 1: Identify the binomial parameters. What are n, p, and what are you counting?","hint":"n = number of trials, p = probability of success on each trial. Here, n = 8 (items inspected), p = 0.15 (defect rate).","answer":"n = 8, p = 0.15 (defect probability), X = number of defects. This is binomial because we have a fixed number of independent trials with constant success probability."},{"prompt":"Step 2: For part (a), calculate P(X = 2) using the binomial formula. Start with the binomial coefficient.","hint":"The binomial coefficient is C(n,k) = n! / (k!(n-k)!). For C(8,2), compute 8 × 7 / (2 × 1).","answer":"C(8,2) = 28. Then multiply by p^2 × (1-p)^6 = (0.15)^2 × (0.85)^6 = 0.0225 × 0.37649 ≈ 0.00848. Final: 28 × 0.00848 ≈ 0.238."},{"prompt":"Step 3: For part (b), find P(X ≤ 1). Which two probabilities must you calculate and add?","hint":"At most 1 means X = 0 or X = 1. Calculate both separately, then add them.","answer":"P(X = 0) = C(8,0) × (0.15)^0 × (0.85)^8 ≈ 0.272. P(X = 1) = C(8,1) × (0.15) × (0.85)^7 ≈ 0.384. Sum = 0.272 + 0.384 ≈ 0.657."}],"caption":"Binomial problems always have fixed n, constant p, and ask for cumulative or exact probabilities. Master the formula setup and arithmetic."}
```
