---
# Alternative body for surface-integrals.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: surface-integrals.worked_example.assured
concept_id: surface-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: surface-integrals.worked_example
for_stance: assured
---

$\mathbf F=(x,y,z)$, sphere radius $2$: on the surface, $\hat n=\frac12(x,y,z)$, so $\mathbf F\cdot\hat n=\frac{x^2+y^2+z^2}{2}=2$, constant, and with $dS=4\sin\theta\,d\theta\,d\phi$, $\iint_S\mathbf F\cdot\hat n\,dS=8\cdot2\pi\cdot2=32\pi$.

Cross-check via Gauss: $\nabla\cdot\mathbf F=3$, and $\iiint_V3\,dV=3\cdot\frac43\pi(2)^3=32\pi$, confirming the surface computation — but only because $S$ happens to be closed. Reach for that shortcut only when the surface actually encloses a volume; an open hemisphere or a single sheet has no divergence-theorem check available, and the parametric route above is then the only route, not merely the more careful one.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Sphere flux calculation","steps":[{"prompt":"Step 1: Write the parameterization of sphere $x^2+y^2+z^2=4$. What are $x(\\theta,\\phi)$, $y(\\theta,\\phi)$, and $z(\\theta,\\phi)$?","hint":"Use spherical coordinates with radius 2. Recall $x=R\\sin\\theta\\cos\\phi$.","answer":"$x=2\\sin\\theta\\cos\\phi$, $y=2\\sin\\theta\\sin\\phi$, $z=2\\cos\\theta$"},{"prompt":"Step 2: For the outward normal on the sphere, express $\\mathbf{n}$ in terms of $(x,y,z)$ and simplify.","hint":"The outward normal is proportional to the position vector $(x,y,z)$. Normalize by the radius.","answer":"$\\mathbf{n} = \\frac{1}{2}(x,y,z) = (\\sin\\theta\\cos\\phi, \\sin\\theta\\sin\\phi, \\cos\\theta)$"},{"prompt":"Step 3: Compute $\\mathbf{F} \\cdot \\mathbf{n}$ where $\\mathbf{F}=(x,y,z)$ at the surface.","hint":"Substitute the parameterization and use $\\cos^2\\phi + \\sin^2\\phi = 1$ and $\\sin^2\\theta + \\cos^2\\theta = 1$.","answer":"$\\mathbf{F} \\cdot \\mathbf{n} = 2$"},{"prompt":"Step 4: Set up the double integral with $dS = 4\\sin\\theta\\,d\\theta\\,d\\phi$ and integrate over $\\theta \\in [0,\\pi]$, $\\phi \\in [0,2\\pi]$.","hint":"The constant value of 2 makes this straightforward. Integrate $\\sin\\theta$ first.","answer":"$\\iint_S \\mathbf{F}\\cdot\\mathbf{n}\\,dS = 32\\pi$"}],"caption":"Flux through a sphere: parameterization → normal → dot product → integration. Standard GATE technique."}
```
