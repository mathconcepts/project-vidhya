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

## The three operations, and where they actually differ

Addition and transpose are structural: same-shape addition is entrywise, transpose just reads $A$ by columns instead of rows. Multiplication does the real work — $(AB)_{ij} = \sum_k A_{ik}B_{kj}$, defined only when columns of $A$ match rows of $B$.

Non-commutativity is not a technicality. $AB$ and $BA$ compose two transformations in opposite order, and "rotate then scale" genuinely differs from "scale then rotate." Associativity does hold — $(AB)C = A(BC)$ — so a chain of transformations can be grouped however is cheapest to compute.

Two identities worth having cold: $(AB)^T = B^TA^T$ (order reverses under transpose) and $(A+B)^T = A^T+B^T$ (order is preserved, since addition already commutes).

Watch for symmetric ($A^T=A$) and skew-symmetric ($A^T=-A$) matrices as exam premises — $A^TA$ is symmetric for any $A$, and that single fact underlies most least-squares and normal-equation questions.

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
