---
# Alternative body for positive-definite-matrices.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: positive-definite-matrices.hook.assured
concept_id: positive-definite-matrices
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: positive-definite-matrices.hook
for_stance: assured
---

$x^TAx > 0$ for every nonzero $x$ is the definition; eigenvalues all positive and Sylvester's leading-minors test are equivalent characterizations, not separate facts to memorize — pick whichever the question hands you cheaply.

Positive semidefinite (eigenvalues $\ge 0$, minors $\ge 0$) is the trap variant: a single zero eigenvalue breaks strict positivity but leaves Cholesky needing a rank-deficient variant. Where does that distinction actually bite in an optimization or covariance question?

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[3,1],[1,2]] — neither eigen-arrow ever flips","duration_sec":9,"linear_map":{"matrix":[[3,1],[1,2]],"num_vectors":16,"eigen":[{"dir":[1,0.61803399],"value":3.61803399},{"dir":[1,-1.61803399],"value":1.38196601}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $A=\\begin{pmatrix}3&1\\\\1&2\\end{pmatrix}$. Watch the two that refuse to turn — do they ever point backward?","text_shaken":"Sixteen arrows, each length 1, meet $A=\\begin{pmatrix}3&1\\\\1&2\\end{pmatrix}$. Two of them will not turn — watch which side they land on.","text_assured":"Both diagonal entries of $A$ are positive — necessary for positive definiteness, but on its own that proves nothing yet.","emphasize":false},{"at_progress":0.22,"text":"Push! Most arrows swing to new directions while stretching — some grow a lot, some barely move, but watch: none of them cross to the opposite side.","text_shaken":"Watch any arrow: it tilts and grows. None of them ever end up pointing the opposite way from where they started.","text_assured":"Every arrow's image stays in the same open half-plane as itself — a visual read of $x^TAx>0$ holding everywhere.","emphasize":false},{"at_progress":0.55,"text":"Two arrows refuse to turn. The one along $(1,0.618)$ stretched by about 3.618. The one along $(1,-1.618)$ stretched by about 1.382 — both positive, neither flipped.","text_shaken":"Check $(1,0.618)$: about 3.618 times longer, same direction. Check $(1,-1.618)$: about 1.382 times longer, same direction. Both grew, neither flipped.","text_assured":"$\\lambda=\\frac{5\\pm\\sqrt5}{2}\\approx3.618,1.382$ — both roots of $\\lambda^2-5\\lambda+5=0$ are positive, so $A$ is positive definite.","emphasize":true},{"at_progress":0.8,"text":"Both stretch factors landed positive — that is what positive definite means: $x^TAx>0$ for every direction, no eigenvector ever flips through the origin.","text_shaken":"Both eigenvalues came out positive. That is the whole definition of positive definite — nothing in this picture ever flips.","text_assured":"Check: trace $=5\\approx3.618+1.382$ and $\\det=5\\approx3.618\\times1.382$ — both positive, consistent with positive definite.","emphasize":false,"trap":{"text":"Students see A's positive diagonal entries and stop checking — but $B=\\begin{pmatrix}1&3\\\\3&1\\end{pmatrix}$ also has positive diagonal, and its eigenvalues are $4,-2$: indefinite, not positive definite.","avoid":"Check every leading principal minor, or every eigenvalue, before calling a matrix positive definite — diagonal entries alone prove nothing."}}]}
```
