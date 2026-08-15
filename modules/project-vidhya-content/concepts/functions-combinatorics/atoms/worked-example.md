---
id: functions-combinatorics-worked-example
concept_id: functions-combinatorics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Functions and Combinatorics — Worked Examples

## Problem 1: Seating with a Constraint (GATE Style)

**Question:** In how many ways can 8 people be seated in a row such that 3 specific people (say A, B, C) are **always together**?

**Step 1 — Treat the group as a single unit.**

Bundle A, B, C into one "super-person". Now we have:

$$8 - 3 + 1 = 6 \text{ entities to arrange}$$

**Step 2 — Arrange the 6 entities.**

$$6! = 720 \text{ ways}$$

**Step 3 — Arrange A, B, C within the bundle.**

A, B, C can be arranged among themselves in $3! = 6$ ways.

**Step 4 — Multiply.**

$$\text{Total} = 6! \times 3! = 720 \times 6 = \boxed{4320}$$

---

## Problem 2: Binomial Coefficient (GATE Style)

**Question:** Find the coefficient of $x^5 y^3$ in $(x + y)^8$.

**Using the Binomial Theorem:**

$$(x + y)^8 = \sum_{k=0}^{8} \binom{8}{k} x^k y^{8-k}$$

We need $k = 5$ (to get $x^5$) and $8 - k = 3$ (to get $y^3$). Both conditions give $k = 5$.

$$\text{Coefficient} = \binom{8}{5} = \binom{8}{3} = \frac{8!}{3! \cdot 5!} = \frac{8 \times 7 \times 6}{3 \times 2 \times 1} = \boxed{56}$$

---

## Problem 3: Counting Functions (GATE Style)

**Question:** Let $A = \{1, 2, 3\}$ and $B = \{a, b, c, d\}$. How many injective (one-to-one) functions exist from $A$ to $B$?

**Reasoning:**

- $f(1)$ can be any of 4 elements: **4 choices**
- $f(2)$ must differ from $f(1)$: **3 choices**
- $f(3)$ must differ from $f(1)$ and $f(2)$: **2 choices**

$$\text{Injective functions} = P(4, 3) = 4 \times 3 \times 2 = \boxed{24}$$

**Total functions (not necessarily injective):** $4^3 = 64$

**Cross-check:** Surjective functions from $A$ to $B$ would require $|A| \geq |B|$, i.e., $3 \geq 4$ — impossible, so there are **0** surjective functions.

---

## Problem 4: Pigeonhole Application (GATE Style)

**Question:** A computer science class has 367 students. Prove that at least 2 students share the same birthday.

**Solution:**

There are 366 possible birthdays (including Feb 29). With 367 students and 366 "pigeonholes" (days):

$$367 > 366 \implies \text{by Pigeonhole Principle, at least 2 students share a birthday.} \checkmark$$

---

## Common Traps

- **Confusing $P$ and $C$:** ask "does order matter?" Sitting in seat 1 vs. seat 2 is different (use $P$); choosing a committee of 3 is not (use $C$).
- **Over-counting in constraints:** always verify whether arrangements within the bundle are counted separately.
- **Surjection requires $n \geq m$:** if you need every codomain element covered, you need at least as many inputs.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: adjacent-seating count and a binomial coefficient","steps":[{"prompt":"How many ways can 5 people be seated in a row such that 2 specific people (X and Y) are always adjacent?","hint":"Treat X and Y as one unit → 4 entities. Arrange in 4! ways, then multiply by the number of ways X,Y can be ordered within the unit.","answer":"48"},{"prompt":"What is the coefficient of x³y⁵ in (x+y)⁸?","hint":"Use C(8,3) = 8!/(3!·5!). The exponents must sum to 8.","answer":"56"}]}
```
