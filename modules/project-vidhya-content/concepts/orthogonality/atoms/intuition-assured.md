---
# Alternative body for orthogonality-intuition, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is moving fast and getting most of this right. The
# base atom's seven-section sweep is time they do not need to spend: they can
# already compute a dot product and apply Gram-Schmidt. What costs them marks
# is the small print — where orthogonal and orthonormal are not interchangeable,
# and which properties survive which operation.
#
# So: no re-derivation, no worked arithmetic. The distinctions that actually
# bite, and nothing else.
#
# The fenced interactive block is copied verbatim from the base atom so the
# widget cannot drift between variants; only prose differs.
id: orthogonality-intuition-assured
concept_id: orthogonality
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: orthogonality-intuition
for_stance: assured
---

$\mathbf{u} \cdot \mathbf{v} = 0$ is the definition; everything else is bookkeeping. The distinctions worth your time:

**Orthogonal is not orthonormal.** A set can be pairwise orthogonal and useless for $Q^TQ = I$, because that identity needs unit length too. Normalise last, but do not forget to normalise; more marks go here than anywhere else in the topic.

**$Q^{-1} = Q^T$ is the payoff, not $\det Q = \pm 1$.** The determinant condition is necessary and nowhere near sufficient: $\operatorname{diag}(2, 1/2)$ has determinant $1$ and is not orthogonal. A stem that offers $\det Q = 1$ and invites you to conclude orthogonality is testing precisely this gap.

**Gram–Schmidt preserves span, not order-independence.** Feed the same set in a different order and you get a different orthonormal basis, both correct. Do not defend a sign or an ordering you were not given.

**$\mathbb{R}^n = W \oplus W^\perp$ gives you dimensions for free.** $\dim W^\perp = n - \dim W$ answers a whole class of questions without computing a single vector.

**Where it costs you.** Projection onto a subspace uses an *orthonormal* basis for that subspace. Projecting onto a merely orthogonal basis without normalising scales each component by $\|\mathbf{q}_i\|^2$ and quietly produces the wrong vector.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag u and v until the dot product hits zero — that's perpendicular",
  "inputs": [
    {"id": "u1", "label": "u1", "min": -3, "max": 3, "step": 0.5, "initial": 3},
    {"id": "u2", "label": "u2", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "v1", "label": "v1", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "v2", "label": "v2", "min": -3, "max": 3, "step": 0.5, "initial": 2}
  ],
  "outputs": [
    {"label": "u · v = u1v1 + u2v2", "formula": "u1*v1 + u2*v2", "digits": 2},
    {"label": "|u|", "formula": "sqrt(u1^2 + u2^2)", "digits": 2},
    {"label": "|v|", "formula": "sqrt(v1^2 + v2^2)", "digits": 2}
  ],
  "caption": "Try to make u · v = 0 by dragging — the instant it hits zero, u and v are exactly perpendicular, whatever their lengths."
}
```
