---
# Alternative body for eigenvalues.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: eigenvalues.hook.shaken
concept_id: eigenvalues
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: eigenvalues.hook
for_stance: shaken
---

Start with one matrix and one arrow.

Draw any arrow from the origin. Apply the matrix. The arrow usually lands somewhere else entirely — pointing a different way, a different length.

Now hunt for an arrow that lands on **its own line**. Same direction, or exactly backwards. Only the length changed.

That arrow is an **eigenvector**. How much it stretched is the **eigenvalue**.

That is the whole idea. Everything after this — the $\det(A-\lambda I)=0$ machinery, the characteristic polynomial — is just how you find those arrows without guessing.

```interactive-spec
{"v":1,"kind":"simulation","title":"The ellipse's own axes are the eigenvectors of [[2,1],[1,2]]","x_expr":"2*cos(t) + sin(t)","y_expr":"cos(t) + 2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.4,"x_max":2.4,"y_min":-2.4,"y_max":2.4},"caption":"Watch the long axis settle along (1,1) — the eigenvector for λ=3 — while the short axis along (1,-1) is λ=1, the direction the matrix stretches least."}
```
