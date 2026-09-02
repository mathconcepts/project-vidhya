---
id: continuous-distributions.worked-example
concept_id: continuous-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Exam scores $X\sim N(50, 100)$ (mean $50$, variance $100$, so $\sigma=10$). Find $P(40<X<70)$.

---

**Step 1 — Standardize both endpoints.**
$$z_1 = \frac{40-50}{10} = -1, \qquad z_2 = \frac{70-50}{10} = 2$$

---

**Step 2 — Rewrite as a standard-normal probability.**
$$P(40<X<70) = P(-1<Z<2) = \Phi(2)-\Phi(-1)$$

---

**Step 3 — Read $\Phi$ from the standard table.** $\Phi(2)=0.9772$, $\Phi(-1)=1-\Phi(1)=1-0.8413=0.1587$.

---

**Step 4 — Subtract.**
$$\boxed{P(40<X<70) = 0.9772 - 0.1587 = 0.8186}$$

**Check.** The interval $[40,70]$ spans from $1\sigma$ below the mean to $2\sigma$ above it — comfortably inside the range where most of the normal curve's area sits, so an answer near $0.82$ (rather than, say, $0.2$ or $0.99$) is consistent with the well-known 68–95–99.7 rule for how much area sits within 1, 2, and 3 standard deviations of the mean.
