---
# Alternative body for positive-definite-matrices.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
id: positive-definite-matrices.hook.shaken
concept_id: positive-definite-matrices
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: positive-definite-matrices.hook
for_stance: shaken
---

Push arrows through $A=\begin{pmatrix}3&1\\1&2\end{pmatrix}$.

Two of them refuse to turn. Both grow longer — one about 3.6 times, the other about 1.4 times.

Neither one flips to the other side. Both stretch factors are positive numbers. That is positive definite.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[3,1],[1,2]] — neither eigen-arrow ever flips","duration_sec":9,"linear_map":{"matrix":[[3,1],[1,2]],"num_vectors":16,"eigen":[{"dir":[1,0.61803399],"value":3.61803399},{"dir":[1,-1.61803399],"value":1.38196601}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $A=\\begin{pmatrix}3&1\\\\1&2\\end{pmatrix}$. Watch the two that refuse to turn — do they ever point backward?","text_shaken":"Sixteen arrows, each length 1, meet $A=\\begin{pmatrix}3&1\\\\1&2\\end{pmatrix}$. Two of them will not turn — watch which side they land on.","text_assured":"Both diagonal entries of $A$ are positive — necessary for positive definiteness, but on its own that proves nothing yet.","emphasize":false},{"at_progress":0.22,"text":"Push! Most arrows swing to new directions while stretching — some grow a lot, some barely move, but watch: none of them cross to the opposite side.","text_shaken":"Watch any arrow: it tilts and grows. None of them ever end up pointing the opposite way from where they started.","text_assured":"Every arrow's image stays in the same open half-plane as itself — a visual read of $x^TAx>0$ holding everywhere.","emphasize":false},{"at_progress":0.45,"text":"Two arrows refuse to turn. The one along $(1,0.618)$ stretched to about 3.618 times its length. The other, along $(1,-1.618)$, stretched to about 1.382 times. Before the next beat — did either one flip to point backward?","text_shaken":"Check $(1,0.618)$: it grew to about 3.618 times as long. Check $(1,-1.618)$: about 1.382 times. Did either one end up pointing the opposite way?","text_assured":"$\\lambda=\\frac{5\\pm\\sqrt5}{2}\\approx3.618,1.382$, the two roots of $\\lambda^2-5\\lambda+5=0$ — before signing off, does either root come out negative?","emphasize":false},{"at_progress":0.62,"text":"No — both stretch factors landed positive, neither one flipped. That is exactly what positive definite means: $x^TAx$ never dips below zero, in any direction.","text_shaken":"No, neither flipped. Both eigenvalues, 3.618 and 1.382, are positive — that's the whole definition of positive definite: $x^TAx>0$ everywhere.","text_assured":"Both roots are positive: $\\lambda\\approx3.618,1.382$ — so $A$ is positive definite, not merely diagonal-positive.","emphasize":true},{"at_progress":0.85,"text":"Check: trace $=5\\approx3.618+1.382$ and $\\det=5\\approx3.618\\times1.382$ — both positive, a quick confirmation any time the signs feel uncertain.","text_shaken":"Check: trace $=3.618+1.382=5$ and $\\det=3.618\\times1.382\\approx5$. Both positive — matches what we just saw.","text_assured":"Check: trace $=5\\approx3.618+1.382$ and $\\det=5\\approx3.618\\times1.382$ — both positive, consistent with positive definite.","emphasize":false,"trap":{"text":"Students see A's positive diagonal entries and stop checking — but $B=\\begin{pmatrix}1&3\\\\3&1\\end{pmatrix}$ also has positive diagonal, and its eigenvalues are $4,-2$: indefinite, not positive definite.","avoid":"Check every leading principal minor, or every eigenvalue, before calling a matrix positive definite — diagonal entries alone prove nothing."}}]}
```
