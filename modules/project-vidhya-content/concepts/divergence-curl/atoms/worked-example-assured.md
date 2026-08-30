---
# Alternative body for divergence-curl.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: divergence-curl.worked_example.assured
concept_id: divergence-curl
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: divergence-curl-worked-example
for_stance: assured
---

$\mathbf F=xy^2\hat i+yz^2\hat j+zx^2\hat k$: $\nabla\cdot\mathbf F=y^2+z^2+x^2=14$ at $(1,2,3)$. Curl's $\hat k$-term is $\partial_x F_y-\partial_y F_x=-2xy=-4$; $\hat i$-term $\partial_yF_z-\partial_zF_y=-2yz=-12$; $\hat j$-term carries the determinant's sign flip, $-(\partial_xF_z-\partial_zF_x)=-2xz=-6$, giving $\nabla\times\mathbf F=-12\hat i-6\hat j-4\hat k$.

$\nabla\cdot(\nabla\times\mathbf F)=0$ is not worth re-deriving here — it is an identity, true for any smooth $\mathbf F$, so plugging in components and confirming $0+0+0=0$ checks that the curl computation is self-consistent, not that it is correct. The mark actually at risk is the $\hat j$-term's sign: drop the minus from the determinant expansion and $\nabla\times\mathbf F$ comes out wrong, yet $\nabla\cdot(\nabla\times\mathbf F)$ still evaluates to $0$ here, because each component depends on only two of the three variables. The identity is a self-consistency check, not a correctness check.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: divergence and curl of F = (xy², yz², zx²)","steps":[{"prompt":"For F = (xy², yz², zx²), write down ∂F_x/∂x, ∂F_y/∂y, ∂F_z/∂z and sum them to get div F.","hint":"Differentiate xy² w.r.t. x, yz² w.r.t. y, and zx² w.r.t. z. Each is a straightforward partial.","answer":"y² + z² + x²; at (1,2,3): 4 + 9 + 1 = 14"},{"prompt":"Compute the k̂ component of curl F = ∂F_y/∂x − ∂F_x/∂y for F = (xy², yz², zx²).","hint":"∂(yz²)/∂x = 0, and ∂(xy²)/∂y = 2xy. The k̂ component is the difference.","answer":"0 − 2xy = −2xy. At (1,2,3): −2(1)(2) = −4"},{"prompt":"State the identity that guarantees div(curl F) = 0 for any smooth field, and confirm it for G = (−2yz, −2xz, −2xy).","hint":"Compute ∂(−2yz)/∂x + ∂(−2xz)/∂y + ∂(−2xy)/∂z.","answer":"The identity is ∇·(∇×F) = 0 always. Each partial is 0, confirming 0+0+0 = 0."}]}
```
