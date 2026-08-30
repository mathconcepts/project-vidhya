---
id: eigenvalues.hook
concept_id: eigenvalues
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Most matrices distort vectors when they act — stretching, rotating, shearing. But every matrix has special vectors it doesn't rotate at all. It only stretches them. Those are eigenvectors. The stretch factor is the eigenvalue. Find them and you've found the matrix's "skeleton."

```interactive-spec
{"v":1,"kind":"simulation","title":"The ellipse's own axes are the eigenvectors of [[2,1],[1,2]]","x_expr":"2*cos(t) + sin(t)","y_expr":"cos(t) + 2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.4,"x_max":2.4,"y_min":-2.4,"y_max":2.4},"narration_steps":[{"at_progress":0,"text":"This traces the image of the unit circle under [[2,1],[1,2]] — every point on the circle, pushed through the matrix.","text_shaken":"The circle here has radius 1. Multiply every point by the matrix $\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$ and watch where it lands.","text_assured":"Symmetric matrix — that guarantees real eigenvalues and perpendicular eigenvectors, which is what makes the next few seconds clean.","emphasize":false},{"at_progress":0.3,"text":"Most directions get rotated AND stretched — the circle is warping into an ellipse, not just growing.","text_shaken":"Watch this point slide sideways as well as outward — direction changed, not just length.","text_assured":"Generic vectors fail $Av=\\lambda v$ for any scalar $\\lambda$ — direction changes, so they're not eigenvectors.","emphasize":false},{"at_progress":0.6,"text":"But along (1,1), the direction never changes, only the length — the matrix stretches it by exactly 3. That's an eigenvector; 3 is its eigenvalue.","text_shaken":"At $(1,1)$: output $(3,3)$ — exactly three times, same direction. That's what an eigenvector looks like.","text_assured":"This clean picture happens because $A$ is symmetric; a rotation matrix (the dashed circle) stretches nothing at all — no real eigenvector to draw.","emphasize":true,"trap":{"text":"Students assume every real matrix has two such clean axes; a rotation matrix has none — its eigenvalues come out complex, with no real eigenvector to draw.","avoid":"Check the discriminant of the characteristic polynomial before assuming real eigen-directions exist."}},{"at_progress":0.85,"text":"Along (1,-1) it barely moves — stretched by only 1. The matrix's laziest direction, eigenvalue 1.","text_shaken":"At $(1,-1)$: output $(1,-1)$ — unchanged. Stretched by exactly $1$.","text_assured":"Two distinct real eigenvalues, $3$ and $1$, with perpendicular eigenvectors — the full payoff of symmetry.","emphasize":true}],"ghost":{"x_expr":"cos(t)","y_expr":"sin(t)"}}
```
