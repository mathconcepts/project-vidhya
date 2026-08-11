---
id: counting-principles.retrieval-prompt
concept_id: counting-principles
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

A 5-digit number is formed by arranging the digits 1, 2, 3, 4, 5 without repetition. How many such numbers are greater than 31,000?

- **(A)** 72
- **(B)** 48
- **(C)** 36
- **(D)** 60

<details>
<summary>Answer</summary>

**A**. For a 5-digit number to be greater than 31,000, the first digit must be 3, 4, or 5 (and if it's 3, the second digit must be ≥1 to ensure the number > 31,000).

**Case 1: First digit is 4 or 5**
- First position: 2 choices (4 or 5)
- Remaining 4 positions: arrange remaining 4 digits in $4! = 24$ ways
- Subtotal: $2 \times 24 = 48$ numbers

**Case 2: First digit is 3, second digit must be ≥4**
- First position: 1 choice (3)
- Second position: 2 choices (4 or 5)
- Remaining 3 positions: arrange remaining 3 digits in $3! = 6$ ways
- Subtotal: $1 \times 2 \times 6 = 12$ numbers

But we need to check: 3 followed by 1, 2, 3 gives numbers 31000–31999, which ARE greater than 31,000.

**Case 2 (Correct): First digit is 3, second digit is any of {1, 2, 4, 5}**
- First position: 1 choice (3)
- Second position: 4 choices (1, 2, 4, or 5)
- Remaining 3 positions: $3! = 6$ ways
- Subtotal: $1 \times 4 \times 6 = 24$ numbers

Total: $48 + 24 = 72$ numbers

</details>
