---
id: ode-bernoulli.exam-pattern
concept_id: ode-bernoulli
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ questions usually test the substitution itself**, not the full solve — "which substitution converts $\frac{dy}{dx} - y = xy^2$ into a linear ODE?" with distractors offering $v=y^2$, $v=y^{-1}$, $v=1/x$, and $v=xy$. The correct read is $n=2 \Rightarrow v = y^{1-n} = y^{-1}$; the other three don't come from the $1-n$ rule at all.

- **NAT questions give an initial condition on the transformed linear equation** and ask for a numeric value of $y$ or $v$ at a point, checking whether you can carry the substitution through to a final answer and back-substitute correctly rather than stopping at $v(x)$.

- **MSQ "recognize the form" questions** mix genuine Bernoulli equations with near-misses — an equation with $y^n$ multiplying $x$ instead of the whole right side, or one where $n=1$ (already linear, no substitution needed) — testing whether you check the exact placement of the $y^n$ term rather than pattern-matching on sight.

- **Time budget:** identifying $n$ and writing down $v=y^{1-n}$ should take under 20 seconds; the full solve (substitute, solve the linear ODE in $v$, back-substitute) fits in about 2 minutes for a clean integer $n$.
