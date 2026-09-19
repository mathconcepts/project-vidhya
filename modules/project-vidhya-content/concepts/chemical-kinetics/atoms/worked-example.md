---
id: chemical-kinetics.worked-example
concept_id: chemical-kinetics
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A drug is eliminated from the bloodstream by first-order kinetics, with a half-life of $4$ hours. If its concentration right after a dose is $80\ \text{mg/L}$, find its concentration after $12$ hours, and the rate constant $k$.

---

**Step 1 — Count what matters before reaching for the exponential formula.** $12$ hours is exactly $3$ half-lives ($12\div4=3$), since the half-life stays fixed for a first-order process however much drug is left. Counting halvings directly is faster than computing $k$ first when the time given is a clean multiple of the half-life.

---

**Step 2 — Halve the concentration three times.** $80 \rightarrow 40$ (after $4\ \text{h}$) $\rightarrow 20$ (after $8\ \text{h}$) $\rightarrow 10$ (after $12\ \text{h}$).

$$\boxed{[\text{Drug}]_{12\text{h}} = 10\ \text{mg/L}}$$

---

**Step 3 — Find the rate constant.** $k=\dfrac{0.693}{t_{1/2}}=\dfrac{0.693}{4}=0.173\ \text{h}^{-1}$ (to $3$ significant figures).

---

**Step 4 — Check with the exponential formula directly.** $[A]=[A]_0e^{-kt}=80\,e^{-0.173\times12}=80\,e^{-2.08}\approx80\times0.125=10\ \text{mg/L}$ — matches the halving-count method exactly, confirming both $k$ and the final concentration.
