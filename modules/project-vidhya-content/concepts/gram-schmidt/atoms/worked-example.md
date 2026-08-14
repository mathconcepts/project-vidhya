---
id: gram-schmidt.worked_example
concept_id: gram-schmidt
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
---

# Gram-Schmidt Process: Worked Example

## Problem

Apply the Gram-Schmidt orthogonalization process to the vectors 
$$v_1 = \begin{pmatrix} 1 \\ 0 \\ 1 \end{pmatrix}, \quad v_2 = \begin{pmatrix} 1 \\ 1 \\ 0 \end{pmatrix}, \quad v_3 = \begin{pmatrix} 0 \\ 1 \\ 1 \end{pmatrix}$$
to obtain an orthonormal basis for $\mathbb{R}^3$.

## Solution

---

**Step 1: Orthogonalize and normalize $v_1$**

Compute the norm: $\|v_1\| = \sqrt{1^2 + 0^2 + 1^2} = \sqrt{2}$

Normalize: 
$$e_1 = \frac{v_1}{\|v_1\|} = \frac{1}{\sqrt{2}} \begin{pmatrix} 1 \\ 0 \\ 1 \end{pmatrix} = \begin{pmatrix} \frac{1}{\sqrt{2}} \\ 0 \\ \frac{1}{\sqrt{2}} \end{pmatrix}$$

---

**Step 2: Orthogonalize $v_2$ and normalize**

Subtract the projection of $v_2$ onto $e_1$:
$$\langle v_2, e_1 \rangle = 1 \cdot \frac{1}{\sqrt{2}} + 1 \cdot 0 + 0 \cdot \frac{1}{\sqrt{2}} = \frac{1}{\sqrt{2}}$$

$$\tilde{u}_2 = v_2 - \langle v_2, e_1 \rangle e_1 = \begin{pmatrix} 1 \\ 1 \\ 0 \end{pmatrix} - \frac{1}{\sqrt{2}} \begin{pmatrix} \frac{1}{\sqrt{2}} \\ 0 \\ \frac{1}{\sqrt{2}} \end{pmatrix} = \begin{pmatrix} 1 - \frac{1}{2} \\ 1 \\ -\frac{1}{2} \end{pmatrix} = \begin{pmatrix} \frac{1}{2} \\ 1 \\ -\frac{1}{2} \end{pmatrix}$$

Normalize:
$$\|\tilde{u}_2\| = \sqrt{\frac{1}{4} + 1 + \frac{1}{4}} = \sqrt{\frac{3}{2}} = \frac{\sqrt{6}}{2}$$

$$e_2 = \frac{\tilde{u}_2}{\|\tilde{u}_2\|} = \frac{2}{\sqrt{6}} \begin{pmatrix} \frac{1}{2} \\ 1 \\ -\frac{1}{2} \end{pmatrix} = \begin{pmatrix} \frac{1}{\sqrt{6}} \\ \frac{2}{\sqrt{6}} \\ -\frac{1}{\sqrt{6}} \end{pmatrix}$$

---

**Step 3: Orthogonalize $v_3$ and normalize**

Subtract projections of $v_3$ onto both $e_1$ and $e_2$:
$$\langle v_3, e_1 \rangle = 0 \cdot \frac{1}{\sqrt{2}} + 1 \cdot 0 + 1 \cdot \frac{1}{\sqrt{2}} = \frac{1}{\sqrt{2}}$$

$$\langle v_3, e_2 \rangle = 0 \cdot \frac{1}{\sqrt{6}} + 1 \cdot \frac{2}{\sqrt{6}} + 1 \cdot \left(-\frac{1}{\sqrt{6}}\right) = \frac{1}{\sqrt{6}}$$

$$\tilde{u}_3 = v_3 - \frac{1}{\sqrt{2}} e_1 - \frac{1}{\sqrt{6}} e_2$$

$$= \begin{pmatrix} 0 \\ 1 \\ 1 \end{pmatrix} - \frac{1}{\sqrt{2}} \begin{pmatrix} \frac{1}{\sqrt{2}} \\ 0 \\ \frac{1}{\sqrt{2}} \end{pmatrix} - \frac{1}{\sqrt{6}} \begin{pmatrix} \frac{1}{\sqrt{6}} \\ \frac{2}{\sqrt{6}} \\ -\frac{1}{\sqrt{6}} \end{pmatrix}$$

$$= \begin{pmatrix} 0 - \frac{1}{2} - \frac{1}{6} \\ 1 - 0 - \frac{2}{6} \\ 1 - \frac{1}{2} + \frac{1}{6} \end{pmatrix} = \begin{pmatrix} -\frac{2}{3} \\ \frac{2}{3} \\ \frac{2}{3} \end{pmatrix}$$

Normalize:
$$\|\tilde{u}_3\| = \sqrt{\frac{4}{9} + \frac{4}{9} + \frac{4}{9}} = \sqrt{\frac{4}{3}} = \frac{2}{\sqrt{3}} = \frac{2\sqrt{3}}{3}$$

$$e_3 = \frac{\sqrt{3}}{2} \begin{pmatrix} -\frac{2}{3} \\ \frac{2}{3} \\ \frac{2}{3} \end{pmatrix} = \begin{pmatrix} -\frac{1}{\sqrt{3}} \\ \frac{1}{\sqrt{3}} \\ \frac{1}{\sqrt{3}} \end{pmatrix}$$

## Answer

$$\boxed{e_1 = \begin{pmatrix} \frac{1}{\sqrt{2}} \\ 0 \\ \frac{1}{\sqrt{2}} \end{pmatrix}, \quad e_2 = \begin{pmatrix} \frac{1}{\sqrt{6}} \\ \frac{2}{\sqrt{6}} \\ -\frac{1}{\sqrt{6}} \end{pmatrix}, \quad e_3 = \begin{pmatrix} -\frac{1}{\sqrt{3}} \\ \frac{1}{\sqrt{3}} \\ \frac{1}{\sqrt{3}} \end{pmatrix}}$$

These vectors form an orthonormal basis: $\|e_i\| = 1$ for all $i$, and $\langle e_i, e_j \rangle = 0$ for $i \neq j$.

---

## Interactive Walk-Through

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Gram-Schmidt on three vectors",
  "steps": [
    {
      "prompt": "Compute the norm of $v_1 = (1, 0, 1)^T$ and use it to normalize.",
      "hint": "$\\|v_1\\| = \\sqrt{1 + 0 + 1}$. Then divide $v_1$ by this norm to get $e_1$.",
      "answer": "$e_1 = \\begin{pmatrix} 1/\\sqrt{2} \\\\ 0 \\\\ 1/\\sqrt{2} \\end{pmatrix}$"
    },
    {
      "prompt": "Compute $\\langle v_2, e_1 \\rangle$, subtract the projection from $v_2$, and normalize the result.",
      "hint": "$\\langle v_2, e_1 \\rangle = 1 \\cdot \\frac{1}{\\sqrt{2}} + 1 \\cdot 0 + 0 \\cdot \\frac{1}{\\sqrt{2}} = \\frac{1}{\\sqrt{2}}$. Form $\\tilde{u}_2 = v_2 - \\frac{1}{\\sqrt{2}} e_1$, then normalize.",
      "answer": "$e_2 = \\begin{pmatrix} 1/\\sqrt{6} \\\\ 2/\\sqrt{6} \\\\ -1/\\sqrt{6} \\end{pmatrix}$"
    },
    {
      "prompt": "Compute $\\langle v_3, e_1 \\rangle$ and $\\langle v_3, e_2 \\rangle$. Subtract both projections from $v_3$ and normalize.",
      "hint": "Form $\\tilde{u}_3 = v_3 - \\langle v_3, e_1 \\rangle e_1 - \\langle v_3, e_2 \\rangle e_2$. The result should be proportional to $(-2/3, 2/3, 2/3)^T$.",
      "answer": "$e_3 = \\begin{pmatrix} -1/\\sqrt{3} \\\\ 1/\\sqrt{3} \\\\ 1/\\sqrt{3} \\end{pmatrix}$"
    }
  ],
  "caption": "Follow the three steps of Gram-Schmidt: normalize $v_1$, orthogonalize $v_2$, then orthogonalize $v_3$."
}
```