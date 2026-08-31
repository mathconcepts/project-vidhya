---
# Alternative body for determinants.hook, served when the learner stance is
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
id: determinants.hook.shaken
concept_id: determinants
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: determinants.hook
for_stance: shaken
---

Start with the unit square — corners $(0,0)$, $(1,0)$, $(1,1)$, $(0,1)$. Area exactly 1.

Push it through the matrix $\begin{pmatrix}2&1\\0&1.5\end{pmatrix}$. Watch the green shape it lands on.

The new area is 3. That number is the **determinant**. Triple the area, det is 3. Flip it over, det goes negative. Flatten to a line, det is 0 — no way back.

```interactive-spec
{"v":1,"kind":"simulation","title":"det([[2,1],[0,1.5]]) = 3: the unit square becomes a parallelogram 3× the area","duration_sec":9,"linear_map":{"matrix":[[2,1],[0,1.5]],"num_vectors":12,"unit_square":true,"area_label":true},"narration_steps":[{"at_progress":0,"text":"The dotted square is the unit square — area exactly 1. It is about to be pushed through the matrix $\\begin{pmatrix}2&1\\\\0&1.5\\end{pmatrix}$. Watch what happens to its area, not its shape.","text_shaken":"Start with the dotted square: corners at $(0,0)$, $(1,0)$, $(1,1)$, $(0,1)$. Its area is exactly 1. The matrix is about to move every corner at once.","text_assured":"The unit square, meeting an upper-triangular matrix — so before anything moves you already know the determinant is just the product of the diagonal: $2\\times1.5=3$.","emphasize":false},{"at_progress":0.22,"text":"Push! The square tilts and stretches into a green parallelogram. Straight sides stay straight — only the corners slide to new spots.","text_shaken":"Watch the green shape grow: each corner of the square is sliding to a new spot. The shape it traces is no longer a square — it leans over.","text_assured":"Linearity means every point moves by the same rule at once, so the edges stay straight — only their lengths and angles change.","emphasize":false},{"at_progress":0.55,"text":"The green parallelogram has settled. Its area is exactly 3 times the dotted square's — that number, 3, is the determinant.","text_shaken":"Count it: the green shape's area is three times the dotted square's area. That number — 3 — is the determinant. You just watched it happen.","text_assured":"Area ×3, read straight off the shape — and because $A$ is upper-triangular, that 3 is exactly $2\\times1.5$, the product of the diagonal entries.","emphasize":true},{"at_progress":0.8,"text":"The determinant is the area-multiplier: how many times bigger any region gets. Here $\\det(A)=(2)(1.5)-(1)(0)=3$, matching what you watched.","text_shaken":"One line to keep: the determinant is how many times bigger the area gets. Here it is 3. $\\det(A)=(2)(1.5)-(1)(0)=3$ — the same 3 you saw grow.","text_assured":"$\\det(A)=ad-bc=(2)(1.5)-(1)(0)=3$ — and because $A$ is triangular, that is also just the product of the diagonal entries, a shortcut worth checking against cofactor expansion.","emphasize":false,"trap":{"text":"Students who just watched area triple assume doubling every entry of the matrix would double the area too.","avoid":"Scale each axis separately: for an $n\\times n$ matrix, $\\det(cA)=c^n\\det(A)$ — here $n=2$, so a factor of $c$ becomes $c^2$, not $c$."}}]}
```
