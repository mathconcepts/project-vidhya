---
id: random-variables.worked-example
concept_id: random-variables
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** A discrete random variable $X$ has PMF $P(X=1)=0.2$, $P(X=2)=0.3$, $P(X=3)=0.5$. Find $E[X]$ and $\text{Var}(X)$.

---

**Step 1 — Confirm it's a valid PMF.** $0.2+0.3+0.5=1$ ✓, and every value is non-negative.

---

**Step 2 — Compute $E[X]$.**
$$E[X] = 1(0.2)+2(0.3)+3(0.5) = 0.2+0.6+1.5 = 2.3$$

---

**Step 3 — Compute $E[X^2]$ (same PMF, values squared).**
$$E[X^2] = 1^2(0.2)+2^2(0.3)+3^2(0.5) = 0.2+1.2+4.5 = 5.9$$

---

**Step 4 — Subtract to get the variance.**
$$\text{Var}(X) = E[X^2]-(E[X])^2 = 5.9 - (2.3)^2 = 5.9-5.29$$
$$\boxed{\text{Var}(X) = 0.61}$$

**Check.** Variance must be non-negative and less than the largest possible squared deviation from the mean; $0.61$ against a range of $[1,3]$ (max deviation$^2\approx1.69$) is a plausible spread — a negative or wildly out-of-range value would flag an arithmetic slip in Step 3 or Step 4.
