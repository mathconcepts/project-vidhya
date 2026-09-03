---
# Alternative body for linear-independence.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: linear-independence.hook.shaken
concept_id: linear-independence
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: linear-independence.hook
for_stance: shaken
---

Take two arrows, $(1,0)$ and $(2,0)$. Notice $(2,0)=2\times(1,0)$ — the second is just a stretched copy. That's dependence.

Push sixteen arrows through the solid matrix: two of them keep their own separate directions.

The dashed grey arrows show a matrix whose two columns secretly point the same way. Every one of those arrows collapses onto one line.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[1,1],[0,2]] — two rails survive, the dashed ghost collapses","duration_sec":9,"linear_map":{"matrix":[[1,1],[0,2]],"num_vectors":16,"eigen":[{"dir":[1,0],"value":1},{"dir":[1,1],"value":2}],"ghost_matrix":[[1,1],[2,2]]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $\\begin{pmatrix}1&1\\\\0&2\\end{pmatrix}$. Two directions here refuse to turn — watch for them as everything else swings.","text_shaken":"Sixteen arrows sit around a circle. They're about to be pushed through a matrix. Two of them are about to do something the rest don't.","text_assured":"Two independent eigenvalues, 1 and 2 — the map has two genuinely different invariant rails, the generic, well-behaved case.","emphasize":false},{"at_progress":0.22,"text":"Push! Most arrows swing to new directions and grow. Two, though, are holding their line — watch the arrow flat on the x-axis, and the arrow along the diagonal.","text_shaken":"Most of the sixteen arrows tilt to new directions. Two are not tilting at all — the flat one on the x-axis, and the one on the diagonal.","text_assured":"Off-rail directions pick up a component outside their own line — $Av$ stops being a multiple of $v$ the instant a direction isn't one of the two eigenvectors.","emphasize":false},{"at_progress":0.5,"text":"Two rails survive: the flat arrow stayed the same length (×1), the diagonal arrow doubled (×2) — two directions, two scale factors. Does that guarantee the plane stays fully 2-D, or could these two still collapse onto one line, like the ghost columns do?","text_shaken":"The flat arrow: same length, ×1. The diagonal arrow: doubled, ×2. Two different directions survived — but does that alone prove the columns are independent, or could they still collapse like the ghost?","text_assured":"$A(1,0)^T=(1,0)^T$ and $A(1,1)^T=(2,2)^T$ — two distinct nonzero scale factors, 1 and 2, on two different lines. Is that alone enough to certify the columns are independent?","emphasize":false},{"at_progress":0.62,"text":"Yes — two different directions surviving, each with its own nonzero scale factor, is exactly what independence means: the plane stays fully spanned, never crushed onto a single line.","text_shaken":"Yes. Two separate directions, both still there, neither collapsed onto the other — that's what independent columns look like: the plane stays fully 2-D.","text_assured":"Independent: eigenvalues 1 and 2, two distinct rails — trace $3=1+2$, det $2=1\\times2$, both check out, confirming the map stays full rank.","emphasize":true},{"at_progress":0.8,"text":"Compare the dashed grey arrows: a different matrix whose two columns are secretly the SAME direction. Every one of its sixteen arrows collapses onto a single line — dependent columns destroy a whole dimension.","text_shaken":"The dashed grey arrows show a different matrix. Its two columns point the same way — dependent. All sixteen arrows collapse onto one line.","text_assured":"The ghost's columns are literally identical vectors: $\\det=0$, rank 1. Two columns that merely LOOK distinct on paper are still dependent if one is a scalar multiple of the other.","emphasize":false,"trap":{"text":"Students see two different-looking columns and assume that alone proves independence; the dashed ghost's two columns are the same direction in disguise.","avoid":"Test for a scalar multiple (equivalently, a zero determinant) — never judge independence by whether the vectors merely look different on the page."}}]}
```
