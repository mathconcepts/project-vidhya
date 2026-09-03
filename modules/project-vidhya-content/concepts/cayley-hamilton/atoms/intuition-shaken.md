---
# Alternative body for cayley-hamilton.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: cayley-hamilton.intuition.shaken
concept_id: cayley-hamilton
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: cayley-hamilton.intuition
for_stance: shaken
---

Take $A=\begin{pmatrix}1&1\\0&2\end{pmatrix}$. Its eigenvalues are $1$ and $2$ — check: $p(1)=1-3+2=0$ and $p(2)=4-6+2=0$. Cayley-Hamilton says the whole matrix $A$, plugged into that same $p$, also comes out zero. Watch it below: both eigen-directions already check out, and together they cover the whole plane.

```interactive-spec
{"v":1,"kind":"simulation","title":"Why p(A)=0 — traced on A's own eigen-directions","x_expr":"cos(t) + sin(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":9,"view_box":{"x_min":-2.2,"x_max":2.2,"y_min":-2.2,"y_max":2.2},"why":"Shown for a diagonalizable 2×2, where the eigen-directions span the plane — the general proof (any size, not just diagonalizable) goes a different route.","narration_steps":[{"at_progress":0,"text":"At $t=0$ the arrow points along $(1,0)$, one of $A$'s own eigen-directions: $\\lambda=1$. That's a root of $p(\\lambda)=\\lambda^2-3\\lambda+2$, since $p(1)=0$. Guess: does swapping in the matrix $A$ itself, on this same direction, also come out zero?","text_shaken":"$t=0$: the arrow sits on $(1,0)$. Its stretch factor is $\\lambda=1$, and $p(1)=1-3+2=0$ — check it. Question: does $A$ itself, on this direction, behave the same way?","text_assured":"$(1,0)$ is the $\\lambda=1$ eigen-direction; $p(1)=0$ by construction. The question this scene answers: does $p(A)$ inherit that zero on the SAME direction?","emphasize":false},{"at_progress":0.125,"text":"By $t=45°$ the arrow has swung to the OTHER eigen-direction, $(1,1)$: eigenvalue $\\lambda=2$, the polynomial's other root — $p(2)=0$ too. Same story, same reason, on both of $A$'s special directions.","text_shaken":"$t=45°$: now on $(1,1)$, eigenvalue $2$. Check it: $p(2)=4-6+2=0$. Both of $A$'s eigen-directions plug into $p$ and vanish.","text_assured":"$(1,1)$ carries $\\lambda=2$, the other root: $p(2)=0$. Both eigen-directions of $A$ now confirmed against $p$.","emphasize":false},{"at_progress":0.4,"text":"Off those two directions — anywhere else on the sweep — $A$ just moves the arrow to a new spot. Nothing to check there; $p$'s promise was only ever about $\\lambda=1$ and $\\lambda=2$.","text_shaken":"Everywhere else on the circle, $A$ just relocates the arrow. No eigenvalue, no check needed — only the two marked directions matter here.","text_assured":"Every non-eigen direction is irrelevant to this argument — $p$ was built from $\\lambda=1,2$ alone, and only the matching eigenvectors carry that promise.","emphasize":false},{"at_progress":0.7,"text":"$(1,0)$ and $(1,1)$ point two different ways — together they reach every direction in the plane. $A$ sends both to zero under $p$, so $p(A)$ must send every vector to zero. That's the theorem, watched instead of memorised.","text_shaken":"Two directions, pointing two different ways, cover the whole plane between them. Both went to zero under $p$. So $p(A)$ zeroes out everything — that's $p(A)=0$.","text_assured":"Two independent eigen-directions span $\\mathbb{R}^2$; $p$ kills both, so $p(A)$ kills their span — all of it. $p(A)=0$ follows, not assumed.","emphasize":true,"trap":{"text":"Students take this two-arrow argument as the actual proof for every matrix. It only runs this cleanly when the eigenvectors span the space, as they do here.","avoid":"Treat this as WHY the theorem feels true for a diagonalizable matrix, not as the general proof — on an exam, cite $p(A)=0$ as the theorem itself."}}]}
```

That means $A^2=3A-2I$: every higher power of $A$ collapses to just $A$ and $I$, and the same equation rearranged gives $A^{-1}$ with no cofactors.
