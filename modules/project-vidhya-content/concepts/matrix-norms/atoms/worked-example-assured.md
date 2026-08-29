---
# Alternative body for matrix-norms.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: matrix-norms.worked-example.assured
concept_id: matrix-norms
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: matrix-norms.worked_example
for_stance: assured
---

**Problem:** Frobenius, 1-norm, condition number of $A = \begin{pmatrix} 4 & 1 \\ 0 & 2 \end{pmatrix}$.

$$\|A\|_F = \sqrt{16+1+0+4} = \sqrt{21}, \qquad \|A\|_1 = \max(4,3) = 4 \text{ (by inspection, no eigenvalues needed)}$$

For $\kappa_2$: $A^TA = \begin{pmatrix}16&4\\4&5\end{pmatrix}$, $\lambda = \frac{21\pm\sqrt{185}}{2} \approx 17.30,\,3.70$, so $\sigma_{1,2}\approx4.16,\,1.92$.

$$\boxed{\|A\|_F \approx 4.58, \quad \|A\|_1 = 4, \quad \kappa_2(A) \approx 2.16}$$

**Skip the eigenvalue computation when you can.** $\|A\|_1$ and $\|A\|_\infty$ are read off directly — the norm asked for decides how much work the question actually needs; only $\|A\|_2/\kappa_2$ forces you into $A^TA$.

**Sanity bound worth knowing:** $\|A\|_2 \le \|A\|_F$ always, since the spectral norm is one singular value and the Frobenius norm aggregates all of them — here $4.16 \le 4.58$ ✓, a one-line check against a sign error in the eigenvalue solve.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Compute matrix norms step-by-step","steps":[{"prompt":"What is the Frobenius norm? Recall: $\\|A\\|_F = \\sqrt{\\sum a_{ij}^2}$","hint":"Square each entry: $4^2 + 1^2 + 0^2 + 2^2$. Then take the square root.","answer":"$\\|A\\|_F = \\sqrt{21}$"},{"prompt":"What is the 1-norm (maximum column sum)?","hint":"Sum absolute values down each column. Take the max of the two column sums.","answer":"Column 1 sum = 4, Column 2 sum = 3. Maximum = 4, so $\\|A\\|_1 = 4$."},{"prompt":"How do we find the spectral norm $\\|A\\|_2$?","hint":"The spectral norm equals the largest singular value. Find eigenvalues of $A^T A$, take square roots, pick the max.","answer":"$\\sigma_1 = \\sqrt{17.30} \\approx 4.16$, so $\\|A\\|_2 \\approx 4.16$."}],"caption":"Work through Frobenius, 1-norm, and spectral norm calculations."}
```
