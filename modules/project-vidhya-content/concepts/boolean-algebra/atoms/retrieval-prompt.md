---
id: boolean-algebra.retrieval-prompt
concept_id: boolean-algebra
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Using a Karnaugh map, minimize the Boolean expression $f(A,B,C) = \sum m(0,1,2,4,5)$.

- **(A)** $\bar{A}\bar{C} + \bar{A}\bar{B}$
- **(B)** $\bar{B} + \bar{A}\bar{C}$
- **(C)** $\bar{A} + \bar{B}\bar{C}$
- **(D)** $\bar{A}\bar{B} + \bar{B}\bar{C}$

<details>
<summary>Answer</summary>

**B**. Place minterms 0(000),1(001),2(010),4(100),5(101) on the K-map. Group 1 (quad): minterms {0,1,4,5} — these all have B=0 regardless of A and C, giving term $\bar{B}$. Group 2 (pair): minterm {2} (010) pairs with minterm {0} (000) — both have A=0 and C=0, giving term $\bar{A}\bar{C}$. Minterm 2 is the only one not covered by the quad. Minimum SOP = $\bar{B} + \bar{A}\bar{C}$. Verify: all 5 minterms are covered and no essential prime implicant is dropped.

</details>
