---
# Alternative body for cayley-hamilton.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: cayley-hamilton.hook.shaken
concept_id: cayley-hamilton
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: cayley-hamilton.hook
for_stance: shaken
---

Plug the matrix itself into its own characteristic polynomial.

For $A = \begin{pmatrix}1&1\\0&2\end{pmatrix}$: the characteristic equation is $\lambda^2-3\lambda+2=0$. Replace $\lambda$ with $A$, and $A^2-3A+2I$ comes out to the zero matrix.

Every square matrix does this to its own equation.

```interactive-spec
{"v":1,"kind":"simulation","title":"Eigen-directions of A=[[1,1],[0,2]] — the same numbers Cayley-Hamilton is built from","x_expr":"cos(t) + sin(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-1.8,"x_max":1.8,"y_min":-2.2,"y_max":2.2},"narration_steps":[{"at_progress":0,"text":"This traces the image of the unit circle under $A=\\begin{pmatrix}1&1\\\\0&2\\end{pmatrix}$ — the matrix whose characteristic polynomial is $\\lambda^2-3\\lambda+2$. At $t=0$ the input point is $(1,0)$, and $A$ sends it right back to $(1,0)$.","text_shaken":"At $t=0$, input $(1,0)$ maps to output $(1,0)$ — identical. Eigenvalue $1$: this direction doesn't move.","text_assured":"$(1,0)$ satisfies $Av=1\\cdot v$ exactly — the defining eigen-equation, and $\\lambda=1$ is a root of $p(\\lambda)=\\lambda^2-3\\lambda+2$.","emphasize":false},{"at_progress":0.3,"text":"By $t\\approx108°$ the image has swung to about $(0.64, 1.90)$ — direction and length both changed; an ordinary point, not an eigenvector.","text_shaken":"At this point: roughly $(0.64,1.90)$. Not the input direction anymore — it moved sideways too.","text_assured":"Generic points fail $Av=\\lambda v$ for any scalar $\\lambda$ — direction changes, which eigenvectors by definition never do.","emphasize":false},{"at_progress":0.625,"text":"At $t=225°$ the input direction is $(-1,-1)$; $A$ sends it to about $(-1.41,-1.41)$ — exactly double length, same direction. Eigenvalue $2$: the polynomial's other root.","text_shaken":"Input direction $(-1,-1)$; output $(-1.41,-1.41)$ — exactly twice as far out, same line. Eigenvalue $2$.","text_assured":"$\\lambda=2$ is the second root of $\\lambda^2-3\\lambda+2$, with eigenvector $(1,1)$ — together the two roots ARE the polynomial Cayley-Hamilton says $A$ satisfies.","emphasize":true,"trap":{"text":"Students think Cayley-Hamilton means substituting $A$ into $\\det(A-\\lambda I)=0$ itself; that expression is identically $0$ for any matrix — trivial, not the theorem.","avoid":"Substitute $A$ into the POLYNOMIAL $p(\\lambda)=\\lambda^2-3\\lambda+2$ directly: $\\lambda^2\\to A^2$, $\\lambda\\to A$, the constant $\\to$ (constant)$\\times I$."}},{"at_progress":0.85,"text":"The sweep continues through ordinary points like $(-0.22,-1.62)$ here — only the two marked directions were eigenvectors. Cayley-Hamilton: $A^2=3A-2I$, built from exactly those two roots.","text_shaken":"This point, roughly $(-0.22,-1.62)$, is ordinary — but $A^2=3A-2I$ always holds, so higher powers of $A$ never need repeated multiplying.","text_assured":"$A^2=3A-2I$ makes every power of $A$ collapse to $c_0I+c_1A$ — a two-number recursion instead of a matrix product, straight from the two eigenvalues above.","emphasize":false}]}
```
