---
# Alternative body for random-variables.worked-example, served when the
# learner stance is `shaken`. See src/content/stance-variants.ts. Every
# multiplication is written out on its own line before summing.
id: random-variables.worked-example.shaken
concept_id: random-variables
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: random-variables.worked-example
for_stance: shaken
---

**Problem.** $X$ takes values 1, 2, 3 with probabilities 0.2, 0.3, 0.5. Find $E[X]$ and $\text{Var}(X)$.

---

**Step 1 — Add the probabilities.** $0.2+0.3+0.5=1$. Valid.

---

**Step 2 — Multiply each value by its probability, then add.**
$1\times0.2=0.2$, $2\times0.3=0.6$, $3\times0.5=1.5$.
$$E[X]=0.2+0.6+1.5=2.3$$

---

**Step 3 — Square each value, multiply by its probability, then add.**
$1^2\times0.2=0.2$, $2^2\times0.3=1.2$, $3^2\times0.5=4.5$.
$$E[X^2]=0.2+1.2+4.5=5.9$$

---

**Step 4 — Subtract $(E[X])^2$ from $E[X^2]$.**
$(2.3)^2=5.29$
$$\boxed{\text{Var}(X)=5.9-5.29=0.61}$$

**Check.** $0.61>0$, as variance must always be.
