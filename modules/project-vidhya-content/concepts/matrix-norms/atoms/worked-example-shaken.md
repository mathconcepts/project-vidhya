---
# Alternative body for matrix-norms.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The scaffolding is REAL but it is not on the page: prose is held at or below
# the base atom's length, because a screen that is visibly longer than the one
# that already defeated this reader signals difficulty no matter how kindly it
# is written. The extra steps live in the walkthrough below, where they unfold
# one at a time when the student asks for them.
#
# The walkthrough may carry MORE steps than the base's, but every answer the
# base asserts survives here in order and the final answer is identical —
# scripts/check-variant-agreement.ts enforces that. Prompts and hints are the
# part that may differ, and they are where the gentler register lives.
id: matrix-norms.worked-example.shaken
concept_id: matrix-norms
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: matrix-norms.worked_example
for_stance: shaken
---

**Problem:** Frobenius norm, 1-norm, and condition number of $A = \begin{pmatrix} 4 & 1 \\ 0 & 2 \end{pmatrix}$.

**Frobenius — square every entry, add, root it.** $\|A\|_F = \sqrt{4^2+1^2+0^2+2^2} = \sqrt{21}$.

**1-norm — sum absolute values down each column, take the bigger sum.** Column 1: $4+0=4$. Column 2: $1+2=3$. So $\|A\|_1 = 4$.

**Spectral norm — via $A^TA$.** $A^TA = \begin{pmatrix}16&4\\4&5\end{pmatrix}$, eigenvalues $\approx17.30, 3.70$, so $\sigma_1\approx4.16$, $\sigma_2\approx1.92$.

$$\boxed{\|A\|_F = \sqrt{21} \approx 4.58, \quad \|A\|_1 = 4, \quad \kappa_2(A) = \sigma_1/\sigma_2 \approx 2.16}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Compute matrix norms step-by-step","steps":[{"prompt":"Square each of the four entries — 4, 1, 0, 2 — and add them. Then take the square root. What do you get?","hint":"$4^2+1^2+0^2+2^2 = 16+1+0+4 = 21$.","answer":"$\\|A\\|_F = \\sqrt{21}$"},{"prompt":"Add absolute values down column 1 (entries 4 and 0), then down column 2 (entries 1 and 2). Which sum is bigger?","hint":"Column 1: $|4|+|0|$. Column 2: $|1|+|2|$.","answer":"Column 1 sum = 4, Column 2 sum = 3. Maximum = 4, so $\\|A\\|_1 = 4$."},{"prompt":"The larger eigenvalue of $A^TA$ is about 17.30. Take its square root — that's the spectral norm.","hint":"$\\|A\\|_2 = \\sigma_1 = \\sqrt{\\lambda_1}$.","answer":"$\\sigma_1 = \\sqrt{17.30} \\approx 4.16$, so $\\|A\\|_2 \\approx 4.16$."}],"caption":"Work through Frobenius, 1-norm, and spectral norm calculations."}
```
