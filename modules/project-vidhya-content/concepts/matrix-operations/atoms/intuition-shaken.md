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

Same-size matrices add entry by entry: $(A+B)_{ij} = A_{ij} + B_{ij}$. Nothing more.

To find $(AB)_{ij}$: take row $i$ of $A$, take column $j$ of $B$, multiply matching pairs, add. Repeat for every row-column pair to fill in $AB$.

Compute $AB$, then compute $BA$. They can come out different — matrix multiplication does not let you swap the order the way ordinary number multiplication does.

Transpose: swap rows and columns, $A^T_{ij} = A_{ji}$. Row 1 of $A$ becomes column 1 of $A^T$.

What GATE checks: multiplying two matrices entry by entry without a slip, checking a product is even defined (columns of the first must match rows of the second), and confirming $(A+B)^T = A^T+B^T$ and $(AB)^T = B^TA^T$ on a small example.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "why": "Reading about matrix multiplication isn't the same as doing it with your own hand — try these three questions yourself before moving on.",
  "title": "Try It: 2×2 Matrix Multiplication",
  "steps": [
    {
      "prompt": "Compute $(AB)_{11}$ for $A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$ and $B=\\begin{pmatrix}5&6\\\\7&8\\end{pmatrix}$.",
      "hint": "Row 1 of $A$ is $(1,2)$. Column 1 of $B$ is $(5,7)$. The $(1,1)$ entry is their dot product.",
      "answer": "$(AB)_{11} = 1\\cdot5 + 2\\cdot7 = 5+14 = 19$"
    },
    {
      "prompt": "Now compute $(AB)_{12}$.",
      "hint": "Row 1 of $A$ is $(1,2)$. Column 2 of $B$ is $(6,8)$.",
      "answer": "$(AB)_{12} = 1\\cdot6 + 2\\cdot8 = 6+16 = 22$"
    },
    {
      "prompt": "Does $AB=BA$? Compute $(BA)_{11}$ to check.",
      "hint": "Row 1 of $B$ is $(5,6)$. Column 1 of $A$ is $(1,3)$.",
      "answer": "$(BA)_{11} = 5\\cdot1 + 6\\cdot3 = 5+18 = 23 \\neq 19$. Order matters — matrix multiplication is not commutative."
    }
  ],
  "caption": "Each entry $(AB)_{ij}$ = dot product of row $i$ of $A$ with column $j$ of $B$."
}
```
