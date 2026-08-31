---
# Alternative body for orthogonality.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: orthogonality.hook.assured
concept_id: orthogonality
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: orthogonality.hook
for_stance: assured
---

$\langle u, v\rangle = 0$ is the whole definition; everything else is consequence.

**Why orthogonal bases are worth constructing.** Coordinates come from projection instead of a solve: $x = \sum_i \frac{\langle x, q_i\rangle}{\langle q_i, q_i\rangle} q_i$. Orthonormalise and the denominators vanish.

**Orthogonal matrices** ($Q^{\mathsf T}Q = I$) preserve every length and angle, so $Q^{-1} = Q^{\mathsf T}$ — inversion for free — and $|\det Q| = 1$. Their eigenvalues all sit on the unit circle.

**The facts that carry marks:**
- An orthogonal *set* of non-zero vectors is automatically independent. Independence questions sometimes reduce to a few dot products.
- $\operatorname{row}(A) \perp \operatorname{null}(A)$ and $\operatorname{col}(A) \perp \operatorname{null}(A^{\mathsf T})$ — the four-subspaces picture, and the reason least squares gives $A^{\mathsf T}A\hat{x} = A^{\mathsf T}b$.
- Symmetric matrices have orthogonal eigenvectors. That is the link to the spectral theorem.
- Orthogonal $\neq$ orthonormal. Gram–Schmidt gives you the first; you still have to normalise for the second, and forgetting to is the standard way to lose the mark.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet a rotation — every length stays, every direction turns","duration_sec":9,"linear_map":{"matrix":[[0.76604444,-0.64278761],[0.64278761,0.76604444]],"num_vectors":16},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows, all length 1, are about to be pushed through a rotation matrix — $40°$ counterclockwise. Watch two things at once: each arrow's length, and its direction.","text_shaken":"Sixteen arrows, each length 1, stand around a circle. They're about to be rotated by $40°$. Watch their lengths as they turn.","text_assured":"$Q^TQ=I$ before anything moves — so whatever happens to these sixteen arrows, their lengths and the angles between them are locked in.","emphasize":false},{"at_progress":0.22,"text":"Push! Every single arrow turns — same $40°$, all together. Look closely: not one of them has grown or shrunk. Same length, new direction.","text_shaken":"Every arrow has swung around by the same angle. Check any one of them: still exactly length 1, just pointing somewhere new.","text_assured":"A rigid rotation of the whole field — the circle of tips stays exactly a circle, radius 1, the entire time.","emphasize":false},{"at_progress":0.55,"text":"The circle of arrow-tips is still a perfect circle, same radius as before — nothing stretched, nothing shrank. Every arrow turned by the identical $40°$.","text_shaken":"The circle is still a perfect circle, same size. It just spun around. Nothing got longer or shorter, anywhere on it.","text_assured":"$\\det=1$, both singular values $=1$: no stretching in any direction whatsoever — the strongest possible length-preservation guarantee.","emphasize":true},{"at_progress":0.8,"text":"No arrow ever changes length, and no two arrows change their angle to each other — but every single arrow DOES change direction. Orthogonal preserves lengths and angles, not direction.","text_shaken":"One thing to keep: an orthogonal matrix never changes any arrow's length. But it does change where each arrow points — every arrow here turned.","text_assured":"$\\|Qx\\|=\\|x\\|$ and $(Qu)\\cdot(Qv)=u\\cdot v$ are the guarantees; $Qx=x$ is not one of them — a rotation moves every direction except at most the axis of a reflection.","emphasize":false,"trap":{"text":"Students think 'orthogonal matrix' means directions are preserved, since lengths and angles between vectors are.","avoid":"Orthogonal preserves lengths and the angles BETWEEN vectors, not any single vector's own direction — a rotation turns every arrow while keeping the circle a circle."}}]}
```
