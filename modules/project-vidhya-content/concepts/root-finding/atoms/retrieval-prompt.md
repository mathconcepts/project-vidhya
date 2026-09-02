---
id: root-finding.retrieval-prompt
concept_id: root-finding
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["bisection", "bracket-halving"]
---

Before checking, try to recall: for $f(x)=x^3-x-1$ on the bracket $[1,2]$, what is $x$ after **two** bisection iterations (the second midpoint tested)?

- **(A)** $1.5$
- **(B)** $1.25$
- **(C)** $1.375$
- **(D)** $1.75$

<details>
<summary>Answer</summary>

**B**. Iteration 1: $c=1.5$, $f(1.5)=0.875>0$, and $f(1)=-1<0$, so the root is in $[1,1.5]$. Iteration 2: $c=(1+1.5)/2=1.25$, $f(1.25)\approx-0.297$. That midpoint, $1.25$, is the answer — the sign at $c$ then tells you which half to keep next.

</details>
