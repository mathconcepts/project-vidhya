---
# Alternative body for gram-schmidt.worked-example, served when the learner
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
id: gram-schmidt.worked-example.assured
concept_id: gram-schmidt
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
scaffold_fade: true
exam_ids: ["*"]
variant_of: gram-schmidt.worked-example
for_stance: assured
---

Orthonormalize $v_1=(1,0,1)$, $v_2=(1,1,0)$, $v_3=(0,1,1)$.

$e_1 = v_1/\|v_1\| = \left(\tfrac{1}{\sqrt2},0,\tfrac{1}{\sqrt2}\right)$.

$u_2 = v_2 - \langle v_2,e_1\rangle e_1 = \left(\tfrac12,1,-\tfrac12\right) \Rightarrow e_2 = \left(\tfrac{1}{\sqrt6},\tfrac{2}{\sqrt6},-\tfrac{1}{\sqrt6}\right)$.

$u_3 = v_3 - \langle v_3,e_1\rangle e_1 - \langle v_3,e_2\rangle e_2 = \left(-\tfrac23,\tfrac23,\tfrac23\right) \Rightarrow e_3 = \left(-\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3}\right)$.

$$\boxed{e_1=\left(\tfrac{1}{\sqrt2},0,\tfrac{1}{\sqrt2}\right),\ e_2=\left(\tfrac{1}{\sqrt6},\tfrac{2}{\sqrt6},-\tfrac{1}{\sqrt6}\right),\ e_3=\left(-\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3},\tfrac{1}{\sqrt3}\right)}$$

**Skip the pairwise dot-product check on the exam** — orthogonality is guaranteed by construction whenever each $u_i$'s formula is applied correctly; verifying it after the fact only catches an arithmetic slip, and a faster catch is $\|u_i\|^2>0$ for each $i$ (independence never breaks) plus a quick trace-style sanity check on one pair, not all three.

**Where this earns marks beyond the mechanics.** These three $e_i$ are literally $Q$'s columns in the QR decomposition of $[v_1\,v_2\,v_3]$; $R$ is upper triangular with the projection coefficients you already computed (e.g. $R_{12}=\langle v_2,e_1\rangle$). A question asking for $Q$ and $R$ separately is this exact computation, relabeled.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Gram-Schmidt on three vectors",
  "steps": [
    {
      "prompt": "Compute the norm of v1 = (1, 0, 1) and use it to normalize.",
      "hint": "||v1|| = sqrt(1 + 0 + 1). Then divide v1 by this norm to get e1.",
      "answer": "e1 = (1/sqrt(2), 0, 1/sqrt(2))"
    },
    {
      "prompt": "Compute <v2, e1>, subtract the projection from v2, and normalize the result.",
      "hint": "<v2, e1> = 1/sqrt(2). Form u2 = v2 − (1/sqrt(2)) e1, then normalize.",
      "answer": "e2 = (1/sqrt(6), 2/sqrt(6), −1/sqrt(6))"
    },
    {
      "prompt": "Compute <v3, e1> and <v3, e2>. Subtract both projections from v3 and normalize.",
      "hint": "Form u3 = v3 − <v3,e1> e1 − <v3,e2> e2. The result should be proportional to (−2/3, 2/3, 2/3).",
      "answer": "e3 = (−1/sqrt(3), 1/sqrt(3), 1/sqrt(3))"
    }
  ],
  "caption": "Follow the three steps of Gram-Schmidt: normalize v1, orthogonalize v2, then orthogonalize v3."
}
```
