---
id: numerical-integration.common-traps
concept_id: numerical-integration
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting the multiplier in composite rules**: Students write "Simpson's rule is $\frac{h}{3}[f_0 + 4f_1 + 2f_2 + \ldots]$" but forget that the 4 and 2 coefficients are for *composite* (repeated) Simpson. For a single application on two subintervals, it's just $\frac{h}{3}[f_0 + 4f_1 + f_2]$. Forgetting this costs an easy 2 marks.
- **Confusing subintervals with nodes**: If $n$ is the number of subintervals, there are $n+1$ nodes. A question says "divide into 4 subintervals" — students mistakenly use 4 nodes instead of 5, getting the wrong $h$.
- **Arithmetic slips in weighted sums**: Simpson's weights are $[1, 4, 2, 4, 2, \ldots, 2, 4, 1]$ (ends are 1, middles alternate 4 and 2). A single weight mistake (writing 2 instead of 4, or vice versa) propagates through the entire answer.
