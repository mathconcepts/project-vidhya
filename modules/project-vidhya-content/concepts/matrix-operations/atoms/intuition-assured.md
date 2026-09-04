---
# Alternative body for matrix-operations.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: matrix-operations.intuition.assured
concept_id: matrix-operations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-operations.intuition
for_stance: assured
---

## Where the three operations actually differ

Addition and transpose are structural — entrywise, and a relabeling of rows as columns. Multiplication is where the marks live: $(AB)_{ij} = \sum_k A_{ik}B_{kj}$, defined only when columns of $A$ match rows of $B$.

Non-commutativity isn't a technicality to memorize — $AB$ and $BA$ compose two maps in opposite order, and "shear then scale" genuinely differs from "scale then shear." Associativity does hold, $(AB)C = A(BC)$, so group a chain however is cheapest.

Two identities worth having automatic: $(AB)^T = B^TA^T$ (reverses) and $(A+B)^T = A^T + B^T$ (doesn't, since addition already commutes).

The exam edge is symmetric/skew-symmetric structure: $A^TA$ is symmetric for *any* $A$, square or not — that single fact underlies most least-squares and normal-equation questions, and it's worth recognizing on sight rather than re-deriving.

The walkthrough below runs the arithmetic on hook's own two shears — worth confirming once, even at this level.

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
