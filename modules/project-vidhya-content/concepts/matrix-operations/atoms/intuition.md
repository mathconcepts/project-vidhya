---
id: matrix-operations.intuition
concept_id: matrix-operations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

Addition and transpose are bookkeeping: add matching entries, or read the matrix by columns instead of rows. Multiplication is the operation that carries content — $(AB)_{ij}$ is row $i$ of $A$ dotted with column $j$ of $B$, and it exists only when the inner dimensions match.

Multiplication composes two transformations. If $B$ sends an input somewhere and $A$ then acts on that result, $AB$ bundles "$B$ first, then $A$" into one matrix. That composition is not symmetric — doing $B$ then $A$ is a different journey than doing $A$ then $B$ — so $AB \neq BA$ in general, even when both products are defined.

What holds regardless of order: multiplication is associative, $(AB)C = A(BC)$, so a chain of transformations can be grouped however is cheapest to compute, and addition distributes over it normally.

GATE tests three things here: computing a single entry without building the whole product, recognizing when a product is even defined, and the two reversals that trip people up — $(AB)^T = B^TA^T$ and $(AB)^{-1} = B^{-1}A^{-1}$ — order flips under both transpose and inverse, never stays put.

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
