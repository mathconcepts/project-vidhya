---
# Alternative body for matrix-operations.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: matrix-operations.intuition.shaken
concept_id: matrix-operations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-operations.intuition
for_stance: shaken
---

## Adding: match position by position

Same-size matrices add entry by entry: $(A+B)_{ij} = A_{ij} + B_{ij}$. Nothing more than that.

## Multiplying: row against column

To find $(AB)_{ij}$, take row $i$ of $A$ and column $j$ of $B$, multiply the matching pairs, and add. Do that for every row-column pair to fill in the whole matrix $AB$.

## Order matters here

Compute $AB$, then compute $BA$. They can come out different. Multiplication of matrices is not like multiplication of numbers — you cannot swap the order and expect the same answer.

## Transpose: flip across the diagonal

Swap rows and columns: $A^T_{ij} = A_{ji}$. Row 1 of $A$ becomes column 1 of $A^T$.

## What GATE checks

- Multiply two given matrices, entry by entry, without a slip
- Check the product is even defined: columns of the first must match rows of the second
- Use the identity matrix as a shortcut — multiplying by it changes nothing
- Confirm $(A+B)^T = A^T+B^T$ and $(AB)^T = B^TA^T$ on a small example

Practice the entry-by-entry multiplication slowly until it stops needing thought — every later topic assumes you can already do it.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Try It: 2×2 Matrix Multiplication",
  "steps": [
    {
      "prompt": "Compute (AB)₁₁ for A = [[1,2],[3,4]] and B = [[5,6],[7,8]].",
      "hint": "Row 1 of A is [1, 2]. Column 1 of B is [5, 7]. The (1,1) entry is their dot product.",
      "answer": "(AB)₁₁ = 1·5 + 2·7 = 5 + 14 = 19"
    },
    {
      "prompt": "Now compute (AB)₁₂.",
      "hint": "Row 1 of A is [1, 2]. Column 2 of B is [6, 8].",
      "answer": "(AB)₁₂ = 1·6 + 2·8 = 6 + 16 = 22"
    },
    {
      "prompt": "Does AB = BA? Compute (BA)₁₁ to check.",
      "hint": "Row 1 of B is [5, 6]. Column 1 of A is [1, 3].",
      "answer": "(BA)₁₁ = 5·1 + 6·3 = 5 + 18 = 23 ≠ 19. Order matters — matrix multiplication is not commutative."
    }
  ],
  "caption": "Each entry (AB)ᴵⱼ = dot product of row i of A with column j of B."
}
```
