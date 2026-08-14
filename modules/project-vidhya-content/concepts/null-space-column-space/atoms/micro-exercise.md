---
id: null-space-column-space.micro_exercise
concept_id: null-space-column-space
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

**Question:** Let $B = \begin{pmatrix} 1 & 3 & -2 \\ 2 & 6 & -4 \\ 0 & 0 & 1 \end{pmatrix}$. 

What is $\dim(\text{Null}(B))$?

(A) 0  
(B) 1  
(C) 2  
(D) 3  

<details>
<summary>Answer</summary>

First, row reduce $B$:
- $R_2 - 2R_1$: second row becomes $[0, 0, 0]$

RREF is:
$$\begin{pmatrix} 1 & 3 & -2 \\ 0 & 0 & 0 \\ 0 & 0 & 1 \end{pmatrix}$$

Rank is 2 (two pivot columns: columns 1 and 3). By rank-nullity:
$$\text{nullity} = n - \text{rank} = 3 - 2 = 1$$

The free variable is $x_2$. Setting $x_2 = 1$ gives $\mathbf{v} = \begin{pmatrix} -3 \\ 1 \\ 0 \end{pmatrix}$.

**Answer: (B) 1**

</details>