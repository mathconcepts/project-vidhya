---
# Alternative body for quadratic-forms.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
id: quadratic-forms.hook.shaken
concept_id: quadratic-forms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: quadratic-forms.hook
for_stance: shaken
---

$Q(x,y)=5x^2+4xy+2y^2$. The $xy$ coefficient is 4 — split it in half, put 2 in each off-diagonal spot: $A=\begin{pmatrix}5&2\\2&2\end{pmatrix}$.

Push arrows through $A$. The circle becomes an ellipse. That ellipse's own axes are the two eigenvectors.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[5,2],[2,2]] — the ellipse IS the level set","duration_sec":9,"linear_map":{"matrix":[[5,2],[2,2]],"num_vectors":16,"eigen":[{"dir":[2,1],"value":6},{"dir":[-1,2],"value":1}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $A=\\begin{pmatrix}5&2\\\\2&2\\end{pmatrix}$, the matrix behind $Q(x,y)=5x^2+4xy+2y^2$.","text_shaken":"Sixteen arrows, each length 1, meet $A=\\begin{pmatrix}5&2\\\\2&2\\end{pmatrix}$. Watch the circle they trace change shape.","text_assured":"$A$ is the matrix of $Q$ — the circle's image under $A$ is exactly the level set $\\{Q(\\mathbf{x})=\\text{const}\\}$.","emphasize":false},{"at_progress":0.22,"text":"Push! The arrow tips grow into an ellipse — most arrows swing to a new angle while stretching, some more than others.","text_shaken":"Watch the ring of arrow-tips: it stops being a circle and squeezes into an oval shape as the arrows move.","text_assured":"The circle deforms into an ellipse because $A$ stretches different directions by different amounts — the eigenvalues set those amounts.","emphasize":false},{"at_progress":0.55,"text":"Two arrows refuse to turn. The one along $(2,1)$ stretched by exactly 6 — the ellipse's long axis. The one along $(-1,2)$ stretched by exactly 1 — the short axis.","text_shaken":"Check $(2,1)$: it grew to 6 times as long — the longest way out. Check $(-1,2)$: it grew to only 1 times as long — the shortest way out.","text_assured":"$A(2,1)^T=(12,6)^T=6(2,1)^T$ and $A(-1,2)^T=(-1,2)^T=1\\cdot(-1,2)^T$ — the ellipse's own axes, ×6 and ×1.","emphasize":true},{"at_progress":0.8,"text":"The ellipse's axes are exactly $A$'s eigen-rails, stretched by its eigenvalues — 6 and 1. Both positive, so $Q$ stays positive everywhere: this is the level-set picture of a positive definite form.","text_shaken":"The ellipse's long and short axes are the two eigen-rails. Both stretch factors, 6 and 1, are positive — so $Q$ never goes negative.","text_assured":"Both eigenvalues positive means $Q$ is positive definite — the level sets are closed ellipses, never an open hyperbola.","emphasize":false,"trap":{"text":"Students read $Q=5x^2+4xy+2y^2$ and write the off-diagonal entries as 4, giving $\\begin{pmatrix}5&4\\\\4&2\\end{pmatrix}$ — the wrong matrix.","avoid":"Halve the $xy$ coefficient: the off-diagonal entries are $4/2=2$, shared equally between the two positions, giving $A=\\begin{pmatrix}5&2\\\\2&2\\end{pmatrix}$."}}]}
```
