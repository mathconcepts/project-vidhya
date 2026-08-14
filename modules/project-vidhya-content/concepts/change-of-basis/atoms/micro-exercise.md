---
id: change-of-basis.micro-exercise
concept_id: change-of-basis
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

# Micro-Exercise: Inverse Relationship

## Question

If $P$ is the change-of-basis matrix from basis $B$ to basis $E$ (so that $[x]_E = P[x]_B$), then the change-of-basis matrix from basis $E$ to basis $B$ is:

**(A)** $P$  
**(B)** $P^T$  
**(C)** $P^{-1}$  
**(D)** $-P$  

## Answer

<details>
<summary>Show Answer</summary>

**Correct answer: (C) $P^{-1}$**

**Explanation:**

If $[x]_E = P[x]_B$, then multiplying both sides on the left by $P^{-1}$ gives:
$$P^{-1}[x]_E = P^{-1}(P[x]_B) = [x]_B.$$

So the change-of-basis matrix from $E$ to $B$ is $P^{-1}$.

More generally: if $P_{B \to E}$ converts from $B$ to $E$, then $P_{E \to B} = (P_{B \to E})^{-1}$.

</details>