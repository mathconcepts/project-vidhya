---
# Alternative body for surface-integrals.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: surface-integrals.worked_example.shaken
concept_id: surface-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: surface-integrals.worked_example
for_stance: shaken
---

$\mathbf F=(x,y,z)$ over the sphere $x^2+y^2+z^2=4$, outward normal. Parametrize $x=2\sin\theta\cos\phi,\,y=2\sin\theta\sin\phi,\,z=2\cos\theta$, giving $\hat n=\frac12(x,y,z)$ and $dS=4\sin\theta\,d\theta\,d\phi$.

Then $\mathbf F\cdot\hat n=\frac{x^2+y^2+z^2}{2}=\frac{4}{2}=2$, constant, since every point sits on the sphere.

$\iint_S\mathbf F\cdot\hat n\,dS=\int_0^{2\pi}\int_0^\pi2\cdot4\sin\theta\,d\theta\,d\phi=8\cdot2\pi\cdot2=32\pi$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Sphere flux calculation","steps":[{"prompt":"Step 1: Write the parameterization of sphere $x^2+y^2+z^2=4$. What are $x(\\theta,\\phi)$, $y(\\theta,\\phi)$, and $z(\\theta,\\phi)$?","hint":"Use spherical coordinates with radius 2. Recall $x=R\\sin\\theta\\cos\\phi$.","answer":"$x=2\\sin\\theta\\cos\\phi$, $y=2\\sin\\theta\\sin\\phi$, $z=2\\cos\\theta$"},{"prompt":"Step 2: For the outward normal on the sphere, express $\\mathbf{n}$ in terms of $(x,y,z)$ and simplify.","hint":"The outward normal is proportional to the position vector $(x,y,z)$. Normalize by the radius.","answer":"$\\mathbf{n} = \\frac{1}{2}(x,y,z) = (\\sin\\theta\\cos\\phi, \\sin\\theta\\sin\\phi, \\cos\\theta)$"},{"prompt":"Step 3: Compute $\\mathbf{F} \\cdot \\mathbf{n}$ where $\\mathbf{F}=(x,y,z)$ at the surface.","hint":"Substitute the parameterization and use $\\cos^2\\phi + \\sin^2\\phi = 1$ and $\\sin^2\\theta + \\cos^2\\theta = 1$.","answer":"$\\mathbf{F} \\cdot \\mathbf{n} = 2$"},{"prompt":"Step 4: Set up the double integral with $dS = 4\\sin\\theta\\,d\\theta\\,d\\phi$ and integrate over $\\theta \\in [0,\\pi]$, $\\phi \\in [0,2\\pi]$.","hint":"The constant value of 2 makes this straightforward. Integrate $\\sin\\theta$ first.","answer":"$\\iint_S \\mathbf{F}\\cdot\\mathbf{n}\\,dS = 32\\pi$"}],"caption":"Flux through a sphere: parameterization → normal → dot product → integration. Standard GATE technique."}
```
