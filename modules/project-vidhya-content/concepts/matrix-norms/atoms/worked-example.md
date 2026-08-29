---
id: matrix-norms.worked_example
concept_id: matrix-norms
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
---

**Problem:** Compute the Frobenius norm, 1-norm, and condition number (spectral norm basis) of 
$$A = \begin{pmatrix} 4 & 1 \\ 0 & 2 \end{pmatrix}$$

**Solution:**

---

**Step 1: Frobenius norm**

Apply the formula $\|A\|_F = \sqrt{\sum_{i,j} a_{ij}^2}$:
$$\|A\|_F = \sqrt{4^2 + 1^2 + 0^2 + 2^2} = \sqrt{16 + 1 + 0 + 4} = \sqrt{21}$$

---

**Step 2: 1-norm (maximum column sum)**

Sum absolute values down each column:
- Column 1: $|4| + |0| = 4$
- Column 2: $|1| + |2| = 3$

Take the maximum: $\|A\|_1 = \max(4, 3) = 4$

---

**Step 3: Spectral norm and condition number**

Compute $A^T A$:
$$A^T A = \begin{pmatrix} 16 & 4 \\ 4 & 5 \end{pmatrix}$$

Find eigenvalues of $A^T A$ using $\det(A^T A - \lambda I) = 0$:
$$(16-\lambda)(5-\lambda) - 16 = \lambda^2 - 21\lambda + 64 = 0$$

By the quadratic formula:
$$\lambda = \frac{21 \pm \sqrt{441 - 256}}{2} = \frac{21 \pm \sqrt{185}}{2}$$

This gives $\lambda_1 \approx 17.30$ and $\lambda_2 \approx 3.70$ (verified: $\lambda_1 + \lambda_2 = 21 = \text{tr}(A^TA)$ ✓, $\lambda_1 \lambda_2 = 64 = \det(A^TA)$ ✓).

The singular values are $\sigma_1 = \sqrt{\lambda_1} \approx 4.16$ and $\sigma_2 = \sqrt{\lambda_2} \approx 1.92$.

Therefore:
$$\|A\|_2 = \sigma_1 \approx 4.16, \quad \kappa_2(A) = \frac{\sigma_1}{\sigma_2} \approx 2.16$$

---

$$\boxed{\|A\|_F = \sqrt{21} \approx 4.58, \quad \|A\|_1 = 4, \quad \kappa_2(A) \approx 2.16}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Compute matrix norms step-by-step","steps":[{"prompt":"What is the Frobenius norm? Recall: $\\|A\\|_F = \\sqrt{\\sum a_{ij}^2}$","hint":"Square each entry: $4^2 + 1^2 + 0^2 + 2^2$. Then take the square root.","answer":"$\\|A\\|_F = \\sqrt{21}$"},{"prompt":"What is the 1-norm (maximum column sum)?","hint":"Sum absolute values down each column. Take the max of the two column sums.","answer":"Column 1 sum = 4, Column 2 sum = 3. Maximum = 4, so $\\|A\\|_1 = 4$."},{"prompt":"How do we find the spectral norm $\\|A\\|_2$?","hint":"The spectral norm equals the largest singular value. Find eigenvalues of $A^T A$, take square roots, pick the max.","answer":"$\\sigma_1 = \\sqrt{17.30} \\approx 4.16$, so $\\|A\\|_2 \\approx 4.16$."}],"caption":"Work through Frobenius, 1-norm, and spectral norm calculations."}
```