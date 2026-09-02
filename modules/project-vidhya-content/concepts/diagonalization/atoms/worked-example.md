---
id: diagonalization-worked-example
concept_id: diagonalization
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Diagonalize $A = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$

This is a standard GATE-style problem. Follow the four-step recipe every time.

---

## Step 1: Find the Eigenvalues

Solve $\det(A - \lambda I) = 0$:

$$\det\begin{pmatrix} 4-\lambda & 1 \\ 2 & 3-\lambda \end{pmatrix} = 0$$

$$(4-\lambda)(3-\lambda) - (1)(2) = 0$$
$$\lambda^2 - 7\lambda + 12 - 2 = 0$$
$$\lambda^2 - 7\lambda + 10 = 0$$
$$(\lambda - 5)(\lambda - 2) = 0$$

$$\boxed{\lambda_1 = 5, \quad \lambda_2 = 2}$$

Two distinct eigenvalues $\Rightarrow$ matrix is **guaranteed diagonalizable**.

---

## Step 2: Find the Eigenvectors

**For $\lambda_1 = 5$:** Solve $(A - 5I)\mathbf{v} = \mathbf{0}$:

$$
\begin{pmatrix} -1 & 1 \\ 2 & -2 \end{pmatrix}\mathbf{v} = \mathbf{0}
$$

Row reduce: $-v_1 + v_2 = 0 \Rightarrow v_1 = v_2$. Take $v_2 = 1$:

$$\mathbf{v}_1 = \begin{pmatrix} 1 \\ 1 \end{pmatrix}
$$

**For $\lambda_2 = 2$:** Solve $(A - 2I)\mathbf{v} = \mathbf{0}$:

$$
\begin{pmatrix} 2 & 1 \\ 2 & 1 \end{pmatrix}\mathbf{v} = \mathbf{0}
$$

$2v_1 + v_2 = 0 \Rightarrow v_2 = -2v_1$. Take $v_1 = 1$:

$$\mathbf{v}_2 = \begin{pmatrix} 1 \\ -2 \end{pmatrix}
$$

---

## Step 3: Form $P$ and $D$

$$P = \begin{pmatrix} \mathbf{v}_1 & \mathbf{v}_2 \end{pmatrix} = \begin{pmatrix} 1 & 1 \\ 1 & -2 \end{pmatrix}, \qquad D = \begin{pmatrix} 5 & 0 \\ 0 & 2 \end{pmatrix}
$$

**Note:** Column $i$ of $P$ must match the $i$-th diagonal entry of $D$.

---

## Step 4: Find $P^{-1}$ and Verify

For a $2\times 2$ matrix $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$, the inverse is $\frac{1}{ad-bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$.

$$\det(P) = (1)(-2) - (1)(1) = -3$$

$$P^{-1} = \frac{1}{-3}\begin{pmatrix} -2 & -1 \\ -1 & 1 \end{pmatrix} = \begin{pmatrix} 2/3 & 1/3 \\ 1/3 & -1/3 \end{pmatrix}
$$

**Verification** $A = PDP^{-1}$:

$$PD = \begin{pmatrix} 1 & 1 \\ 1 & -2 \end{pmatrix}\begin{pmatrix} 5 & 0 \\ 0 & 2 \end{pmatrix} = \begin{pmatrix} 5 & 2 \\ 5 & -4 \end{pmatrix}
$$

$$(PD)P^{-1} = \begin{pmatrix} 5 & 2 \\ 5 & -4 \end{pmatrix}\begin{pmatrix} 2/3 & 1/3 \\ 1/3 & -1/3 \end{pmatrix} = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix} = A \checkmark$$

---

## GATE Follow-Up: Compute $A^3$ Efficiently

$$A^3 = PD^3P^{-1}, \qquad D^3 = \begin{pmatrix} 125 & 0 \\ 0 & 8 \end{pmatrix}
$$

$$PD^3 = \begin{pmatrix} 1 & 1 \\ 1 & -2 \end{pmatrix}\begin{pmatrix} 125 & 0 \\ 0 & 8 \end{pmatrix} = \begin{pmatrix} 125 & 8 \\ 125 & -16 \end{pmatrix}
$$

$$A^3 = \begin{pmatrix} 125 & 8 \\ 125 & -16 \end{pmatrix}\begin{pmatrix} 2/3 & 1/3 \\ 1/3 & -1/3 \end{pmatrix} = \begin{pmatrix} \tfrac{250+8}{3} & \tfrac{125-8}{3} \\ \tfrac{250-16}{3} & \tfrac{125+16}{3} \end{pmatrix} = \begin{pmatrix} 86 & 39 \\ 78 & 47 \end{pmatrix}
$$

$$\boxed{A^3 = \begin{pmatrix} 86 & 39 \\ 78 & 47 \end{pmatrix}}$$

Without diagonalization this would require two full matrix multiplications ($A \cdot A \cdot A$). With it, just two scalar cubes ($5^3=125$, $2^3=8$) and one matrix product with $P^{-1}$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: diagonalizing A = [[4,1],[2,3]] to find A^10","steps":[{"prompt":"What is the characteristic polynomial of $A = \\\\begin{pmatrix}4&1\\\\\\\\2&3\\\\end{pmatrix}$?","hint":"Expand $\\\\det(A - \\\\lambda I) = (4-\\\\lambda)(3-\\\\lambda) - 2$.","answer":"$\\\\lambda^2 - 7\\\\lambda + 10 = 0$, giving eigenvalues $\\\\lambda = 5$ and $\\\\lambda = 2$."},{"prompt":"Find the eigenvector for $\\\\lambda = 2$. Solve $(A - 2I)\\\\mathbf{v} = \\\\mathbf{0}$.","hint":"Row reduce $\\\\begin{pmatrix}2&1\\\\\\\\2&1\\\\end{pmatrix}$. The single equation is $2v_1 + v_2 = 0$.","answer":"$v_2 = -2v_1$, so $\\\\mathbf{v}_2 = \\\\begin{pmatrix}1\\\\\\\\-2\\\\end{pmatrix}$ (or any scalar multiple)."},{"prompt":"Write down $P$ and $D$, then state $A^{10}$ in terms of $P$, $D$, and $P^{-1}$.","hint":"$P$ has eigenvectors as columns; $D$ has the matching eigenvalues on the diagonal. Use $A^k = PD^kP^{-1}$.","answer":"$P = \\\\begin{pmatrix}1&1\\\\\\\\1&-2\\\\end{pmatrix}$, $D = \\\\begin{pmatrix}5&0\\\\\\\\0&2\\\\end{pmatrix}$, so $A^{10} = P\\\\begin{pmatrix}5^{10}&0\\\\\\\\0&2^{10}\\\\end{pmatrix}P^{-1}$."}]}
```
