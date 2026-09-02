---
id: discrete-distributions.worked-example
concept_id: discrete-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** A component passes a quality test independently with probability $p=0.3$. In a batch of $n=5$ components, what is the probability that **exactly 2** pass?

---

**Step 1 — Confirm the model.** Fixed number of trials ($n=5$), constant success probability ($p=0.3$ each), independent — this is Binomial, not Hypergeometric (no finite pool being drawn down).

---

**Step 2 — Write the PMF.**
$$P(X=k) = \binom{n}{k}p^k(1-p)^{n-k}$$

---

**Step 3 — Substitute $k=2$.**
$$P(X=2) = \binom{5}{2}(0.3)^2(0.7)^3 = 10 \times 0.09 \times 0.343$$

---

**Step 4 — Multiply.** $10\times0.09=0.9$, then $0.9\times0.343=0.3087$.
$$\boxed{P(X=2) = 0.3087}$$

**Check.** Sum the full PMF over $k=0,\dots,5$: $0.16807+0.36015+0.3087+0.1323+0.02835+0.00243 = 1.00000$ — confirms $0.3087$ sits correctly among probabilities that together account for every outcome.
