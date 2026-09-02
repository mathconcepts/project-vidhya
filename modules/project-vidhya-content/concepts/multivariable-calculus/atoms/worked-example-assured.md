---
# Alternative body for multivariable-calculus.worked_example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multivariable-calculus.worked_example.assured
concept_id: multivariable-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: multivariable-calculus.worked_example
for_stance: assured
---

The result generalizes past this one example: whenever a path $(x(t),y(t))$ stays on a single level curve of $z=f(x,y)$ — here, the unit circle, a level curve of $x^2+y^2$ — the chain rule MUST return $dz/dt=0$ along it, since $z$ is constant by definition of "level curve." The individual terms $2x\,dx/dt$ and $2y\,dy/dt$ need not vanish separately; only their sum does, because the gradient is perpendicular to the path's tangent direction at every point of a level curve, making their dot product zero. Recognizing "this path traces a level set of $z$" before differentiating turns a two-line arithmetic check into a one-line structural argument, and flags immediately if an arithmetic slip produced a nonzero answer where structure demands zero.

$$
\boxed{\left.\frac{dz}{dt}\right|_{t=\pi/4}=0}
$$
