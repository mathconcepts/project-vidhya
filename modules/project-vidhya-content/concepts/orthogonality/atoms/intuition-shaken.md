---
# Alternative body for orthogonality-intuition, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# The base atom is a reference sweep: seven sections covering orthonormal sets,
# Gram-Schmidt, orthogonal matrices, complements and QR. That is the right
# shape for someone consolidating. It is the wrong shape for someone who has
# just got several wrong, because the first thing they meet is the size of what
# they do not know yet.
#
# So this variant does one idea, with numbers, and stops. Everything else in
# the base is reachable from the other atoms in the concept; nothing is lost by
# not stacking it here.
#
# The fenced interactive block is copied verbatim from the base atom so the
# widget cannot drift between variants; only prose differs.
id: orthogonality-intuition-shaken
concept_id: orthogonality
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: orthogonality-intuition
for_stance: shaken
---

## Two numbers, one question

Take $\mathbf{u} = (3, 1)$ and $\mathbf{v} = (1, 2)$. Multiply matching entries and add:

$$\mathbf{u} \cdot \mathbf{v} = (3)(1) + (1)(2) = 5$$

Not zero. Now try $\mathbf{v} = (1, -3)$:

$$\mathbf{u} \cdot \mathbf{v} = (3)(1) + (1)(-3) = 0$$

Zero. Draw those two arrows and they meet at a square corner.

That is the whole definition:

$$\mathbf{u} \cdot \mathbf{v} = 0 \iff \mathbf{u} \perp \mathbf{v}$$

Length does not enter into it. $(3,1)$ is perpendicular to $(1,-3)$, and also to $(2,-6)$, and to $(-1,3)$. Same direction, any scale.

**The one thing to hold onto.** Every other result in this topic — orthonormal sets, Gram–Schmidt, $Q^TQ = I$ — is this one test applied repeatedly. If you can compute a dot product and check it against zero, you can follow all of them.

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
