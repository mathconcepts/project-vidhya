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

Try it below with hook's own two shears — the same $A$ and $B$ whose product you already watched move sixteen arrows.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "why": "Reading about matrix multiplication isn't the same as doing it with your own hand — these are hook's own two shears, the ones whose product you already watched move sixteen arrows.",
  "title": "Try It: A and B From the Hook Animation",
  "steps": [
    {
      "prompt": "Compute $(AB)_{11}$ for $A=\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ and $B=\\begin{pmatrix}1&0\\\\1&1\\end{pmatrix}$ — the same two shears from the hook animation.",
      "hint": "Row 1 of $A$ is $(1,1)$. Column 1 of $B$ is $(1,1)$. The $(1,1)$ entry is their dot product.",
      "answer": "$(AB)_{11} = 1\\cdot1 + 1\\cdot1 = 1+1 = 2$ — matching the top-left entry of $AB=\\begin{pmatrix}2&1\\\\1&1\\end{pmatrix}$ from the hook."
    },
    {
      "prompt": "Now compute $(AB)_{12}$.",
      "hint": "Row 1 of $A$ is $(1,1)$. Column 2 of $B$ is $(0,1)$.",
      "answer": "$(AB)_{12} = 1\\cdot0 + 1\\cdot1 = 0+1 = 1$"
    },
    {
      "prompt": "Does $AB=BA$? Compute $(BA)_{11}$ to check.",
      "hint": "Row 1 of $B$ is $(1,0)$. Column 1 of $A$ is $(1,0)$.",
      "answer": "$(BA)_{11} = 1\\cdot1 + 0\\cdot0 = 1 \\neq 2$. Order matters — matrix multiplication is not commutative, and this $1$ is the top-left entry of the ghost matrix $BA=\\begin{pmatrix}1&1\\\\1&2\\end{pmatrix}$ you saw in the hook."
    }
  ],
  "caption": "Each entry $(AB)_{ij}$ = dot product of row $i$ of $A$ with column $j$ of $B$ — the exact numbers behind the hook's solid AB arrows and dashed BA ghosts."
}
```
