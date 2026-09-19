---
id: chemical-kinetics.worked-example-shaken
concept_id: chemical-kinetics
atom_type: worked_example
variant_of: chemical-kinetics.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A drug is eliminated from the bloodstream by first-order kinetics, with a half-life of $4$ hours. If its concentration right after a dose is $80\ \text{mg/L}$, find its concentration after $12$ hours, and the rate constant $k$.

---

**Step 1 — Find the rate constant from the half-life.** $k=\dfrac{0.693}{t_{1/2}}=\dfrac{0.693}{4}=0.173\ \text{h}^{-1}$.

---

**Step 2 — Count how many half-lives have passed.** $12\ \text{h} \div 4\ \text{h} = 3$ half-lives.

---

**Step 3 — Halve the concentration once.** $80 \div 2 = 40\ \text{mg/L}$ (after $4\ \text{h}$).

---

**Step 4 — Halve it again.** $40 \div 2 = 20\ \text{mg/L}$ (after $8\ \text{h}$).

---

**Step 5 — Halve it a third time.** $20 \div 2 = 10\ \text{mg/L}$ (after $12\ \text{h}$).

$$\boxed{[\text{Drug}]_{12\text{h}} = 10\ \text{mg/L}}$$

---

**Step 6 — Check using the exponential formula.** $[A]=80\,e^{-0.173\times12}=80\,e^{-2.08}\approx80\times0.125=10\ \text{mg/L}$ — matches the step-by-step halving exactly.
