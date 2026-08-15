---
id: random-variables-worked-example
concept_id: random-variables
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# GATE Problem: Binomial and Poisson Random Variables

## Part A — Binomial Distribution

Let $X \sim B(n=10,\, p=0.3)$. Find $P(X=3)$, $E[X]$, and $\text{Var}(X)$.

### Step 1 — Identify the Parameters

$n = 10$ independent trials, each with success probability $p = 0.3$.

### Step 2 — Compute $P(X = 3)$

$$P(X = 3) = \binom{10}{3}(0.3)^3(0.7)^7$$

$$\binom{10}{3} = \frac{10!}{3!\,7!} = 120$$

$$(0.3)^3 = 0.027, \qquad (0.7)^7 = 0.0823543$$

$$P(X = 3) = 120 \times 0.027 \times 0.0823543$$

$$\boxed{P(X = 3) \approx 0.2668}$$

### Step 3 — Mean and Variance

$$E[X] = np = 10 \times 0.3 = \mathbf{3}$$

$$\text{Var}(X) = np(1-p) = 10 \times 0.3 \times 0.7 = \mathbf{2.1}$$

---

## Part B — Poisson Distribution

The number of packets arriving at a router per millisecond follows $X \sim \text{Po}(\lambda = 2)$. Find $P(X \leq 1)$.

### Step 1 — Recall the Poisson PMF

$$P(X = k) = \frac{e^{-\lambda}\,\lambda^k}{k!}$$

### Step 2 — Compute Each Term

$$P(X = 0) = \frac{e^{-2} \cdot 2^0}{0!} = e^{-2} \approx 0.1353$$

$$P(X = 1) = \frac{e^{-2} \cdot 2^1}{1!} = 2e^{-2} \approx 0.2707$$

### Step 3 — Add

$$P(X \leq 1) = P(X=0) + P(X=1) = e^{-2}(1 + 2) = 3e^{-2}$$

$$\boxed{P(X \leq 1) = 3e^{-2} \approx 0.4060}$$

### Step 4 — Mean and Variance (quick check)

For Poisson, mean = variance = $\lambda$:

$$E[X] = 2, \qquad \text{Var}(X) = 2$$

---

## Comparison Summary

| | Binomial $B(10, 0.3)$ | Poisson $\text{Po}(2)$ |
|---|---|---|
| $E[X]$ | 3 | 2 |
| $\text{Var}(X)$ | 2.1 | 2 |
| $P(\text{specific value})$ | $\binom{n}{k}p^k(1-p)^{n-k}$ | $e^{-\lambda}\lambda^k / k!$ |

**GATE tip:** When you see "n large, p small, $\lambda = np$ moderate," approximate Binomial with Poisson — the computation is far faster.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: binomial P(X=3) and Poisson P(X≤1) computations","steps":[{"prompt":"Let X ~ Poisson(λ=3). What is P(X = 2)?","hint":"Use the Poisson PMF: P(X=k) = e^{-λ} · λ^k / k!. Substitute λ=3 and k=2. Recall e^{-3} ≈ 0.0498.","answer":"P(X=2) = e^{-3} · 3² / 2! = e^{-3} · 9 / 2 = 4.5 · e^{-3} ≈ 4.5 × 0.0498 ≈ 0.2240"},{"prompt":"For X ~ B(n=5, p=0.4), use the computing formula Var(X) = E[X²] − (E[X])² to verify Var(X) = np(1−p).","hint":"First compute E[X] = np = 2. Then E[X²] = Var(X) + (E[X])² = 1.2 + 4 = 5.2. Check: np(1-p) = 5 × 0.4 × 0.6 = 1.2.","answer":"E[X] = np = 5 × 0.4 = 2. Var(X) = np(1−p) = 5 × 0.4 × 0.6 = 1.2. Using the computing formula: E[X²] = Var(X) + (E[X])² = 1.2 + 4 = 5.2, and Var(X) = E[X²] − (E[X])² = 5.2 − 4 = 1.2. Both methods agree."}]}
```
