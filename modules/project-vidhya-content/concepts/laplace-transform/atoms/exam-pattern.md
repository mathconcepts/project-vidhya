---
id: laplace-transform.exam-pattern
concept_id: laplace-transform
atom_type: exam_pattern
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT (numeric answer):** compute $\mathcal{L}\{f(t)\}$ for a specific $f(t)$, then evaluate the result at a stated value of $s$. Example: find $\mathcal{L}\{e^{-2t}\sin(3t)\}$ evaluated at $s=1$. Using the shifted-sine pair, $\mathcal{L}\{e^{-2t}\sin(3t)\} = \dfrac{3}{(s+2)^2+9}$; at $s=1$ this is $\dfrac{3}{9+9}=\dfrac{1}{6}$.
- **MCQ:** match a given $F(s)$ to the correct $f(t)$ from four options built from the standard-pairs table, or the reverse (given $f(t)$, pick $F(s)$). The distractors are usually one property away from correct — a missing shift, a sign flip on $a$, or an ROC that names the wrong half-plane.
- **MSQ:** pick which statements about linearity, the differentiation rule, or the ROC are true. A frequent false option claims a property holds "for all $s$" when it should be qualified by $\text{Re}(s) > \sigma_c$.

**Time budget:** a direct table-lookup transform should cost under a minute once the pairs are memorised; only fall back to evaluating the defining integral $\int_0^\infty e^{-st}f(t)\,dt$ directly when $f(t)$ doesn't match any standard pair, and budget two to three minutes for that case.
