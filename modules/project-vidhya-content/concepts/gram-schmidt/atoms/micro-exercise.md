---
id: gram-schmidt.micro_exercise
concept_id: gram-schmidt
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

# Gram-Schmidt Process: Micro Exercise

## Question

Apply Gram-Schmidt orthogonalization to $v_1 = \begin{pmatrix} 1 \\ 1 \end{pmatrix}$ and $v_2 = \begin{pmatrix} 2 \\ 0 \end{pmatrix}$ in $\mathbb{R}^2$.

What are the resulting orthonormal vectors $e_1$ and $e_2$? Verify that $\langle e_1, e_2 \rangle = 0$.

<details>
<summary>Answer</summary>

**Step 1:** Normalize $v_1$.
$$\|v_1\| = \sqrt{1 + 1} = \sqrt{2} \implies e_1 = \frac{1}{\sqrt{2}} \begin{pmatrix} 1 \\ 1 \end{pmatrix}$$

**Step 2:** Orthogonalize $v_2$ against $e_1$.
$$\langle v_2, e_1 \rangle = 2 \cdot \frac{1}{\sqrt{2}} + 0 \cdot \frac{1}{\sqrt{2}} = \frac{2}{\sqrt{2}} = \sqrt{2}$$

$$\tilde{u}_2 = v_2 - \sqrt{2} \, e_1 = \begin{pmatrix} 2 \\ 0 \end{pmatrix} - \sqrt{2} \begin{pmatrix} \frac{1}{\sqrt{2}} \\ \frac{1}{\sqrt{2}} \end{pmatrix} = \begin{pmatrix} 1 \\ -1 \end{pmatrix}$$

**Step 3:** Normalize $\tilde{u}_2$.
$$\|\tilde{u}_2\| = \sqrt{1 + 1} = \sqrt{2} \implies e_2 = \frac{1}{\sqrt{2}} \begin{pmatrix} 1 \\ -1 \end{pmatrix}$$

**Verification:**
$$\langle e_1, e_2 \rangle = \frac{1}{\sqrt{2}} \cdot \frac{1}{\sqrt{2}} + \frac{1}{\sqrt{2}} \cdot \left(-\frac{1}{\sqrt{2}}\right) = \frac{1}{2} - \frac{1}{2} = 0 \,\checkmark$$

**Answer:**
$$e_1 = \begin{pmatrix} \frac{1}{\sqrt{2}} \\ \frac{1}{\sqrt{2}} \end{pmatrix}, \quad e_2 = \begin{pmatrix} \frac{1}{\sqrt{2}} \\ -\frac{1}{\sqrt{2}} \end{pmatrix}$$

</details>