---
id: gram-schmidt.interleaved-drill
concept_id: gram-schmidt
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: gram-schmidt.micro_exercise
---

**Cross-concept check: orthogonality → Gram-Schmidt.**

$v_1 = \begin{pmatrix} 1 \\ 1 \\ 0\end{pmatrix}$, $v_2 = \begin{pmatrix} 2 \\ 0 \\ 1\end{pmatrix}$, and $w = \begin{pmatrix} 3 \\ 1 \\ 1\end{pmatrix}$, which lies in $\text{span}\{v_1, v_2\}$ since $w = v_1 + v_2$.

**Question 1 (orthogonality):** Is $\{v_1, v_2\}$ orthogonal? And why does the answer change how much work it takes to find the coordinates of $w$ in this basis?

*Answer:* $\langle v_1, v_2\rangle = 1(2) + 1(0) + 0(1) = 2 \neq 0$ — not orthogonal. In a **non-orthogonal** basis, finding coordinates means solving the linear system $c_1 v_1 + c_2 v_2 = w$. In an **orthogonal** basis, each coordinate is an independent dot product — no system, no elimination, and each coefficient can be computed on its own.

**Question 2 (Gram-Schmidt):** Orthogonalize, then take the coordinates of $w$ for free.

*Answer:* One step, keeping vectors unnormalized:

$$u_1 = v_1, \qquad u_2 = v_2 - \frac{\langle v_2, u_1\rangle}{\langle u_1, u_1\rangle}u_1 = \begin{pmatrix} 2 \\ 0 \\ 1\end{pmatrix} - \frac{2}{2}\begin{pmatrix} 1 \\ 1 \\ 0\end{pmatrix} = \begin{pmatrix} 1 \\ -1 \\ 1\end{pmatrix}$$

Check: $\langle u_1, u_2\rangle = 1 - 1 + 0 = 0$ ✓. Normalizing gives $e_1 = \tfrac{1}{\sqrt2}(1,1,0)^T$ and $e_2 = \tfrac{1}{\sqrt3}(1,-1,1)^T$ (verified).

Now the payoff — coordinates of $w$ with no system solved:

$$\frac{\langle w, u_1\rangle}{\langle u_1, u_1\rangle} = \frac{3+1+0}{2} = 2, \qquad \frac{\langle w, u_2\rangle}{\langle u_2, u_2\rangle} = \frac{3-1+1}{3} = 1$$

So $w = 2u_1 + u_2 = 2(1,1,0)^T + (1,-1,1)^T = (3,1,1)^T$ ✓.

**Why this drill exists:** the misconception is that Gram-Schmidt is bookkeeping — a tidier basis for its own sake. It isn't. Orthogonality is what makes coordinates *free*: dot products replace a linear solve, and each coefficient becomes independent of the others. That property is the reason the process exists, and it is why orthonormal bases show up everywhere from QR to least squares to Fourier series.
