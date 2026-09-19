---
id: differential-equations-jee.retrieval_prompt
concept_id: differential-equations-jee
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Question:** State the decision rule for choosing between the variable-separable, homogeneous, and linear first-order methods when solving $\dfrac{dy}{dx}=f(x,y)$.

<details>
<summary>Answer</summary>

**Check 1 — Separable?** Can the equation be rearranged into $g(y)\,dy=h(x)\,dx$, with $x$ and $y$ fully on opposite sides? If yes, integrate both sides independently.

**Check 2 — Homogeneous?** Is the right side expressible as a function of $y/x$ alone — equivalently, does $f(\lambda x,\lambda y)=f(x,y)$ for every $\lambda$? If yes, substitute $y=vx$ to reduce it to a separable equation in $v$ and $x$.

**Check 3 — Linear?** Can the equation be written as $\dfrac{dy}{dx}+P(x)y=Q(x)$, with $y$ and its derivative appearing only to the first power and only added (never multiplied together or appearing inside another function)? If yes, use the integrating factor $e^{\int P(x)\,dx}$.

Run the checks in this order — a genuinely linear equation with $x$ and $y$ mixed additively (e.g. $\dfrac{dy}{dx}-y=e^{2x}$) will fail check 1 outright, since $y$ and $x$ cannot be separated onto opposite sides at all.

</details>
