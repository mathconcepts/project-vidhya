---
id: jordan-normal-form.common_traps
concept_id: jordan-normal-form
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Confusing minimal polynomial exponent with algebraic multiplicity.**
The exponent in the minimal polynomial $m_A(x) = (x - \lambda)^d$ is the **size of the largest Jordan block** for $\lambda$, not the algebraic multiplicity. For example, if a $4 \times 4$ matrix has eigenvalue $\lambda = 5$ with one $2 \times 2$ block and two $1 \times 1$ blocks, the algebraic multiplicity is 4 but the minimal polynomial is $(x - 5)^2$.

**Trap 2: Assuming a matrix is diagonalizable just because it has distinct eigenvalues in the problem statement.**
Always check the geometric multiplicity (dimension of the eigenspace). If it's less than the algebraic multiplicity, the matrix is defective and requires Jordan blocks. The converse is foolproof: distinct eigenvalues → diagonalizable. But repeated eigenvalues → must verify.

**Trap 3: Forgetting that the minimal polynomial must have at least one factor for each distinct eigenvalue.**
Even if a Jordan block has size 1 (i.e., the eigenvalue is non-defective for that block), the minimal polynomial must include $(x - \lambda)^1$ or higher. Never write $m_A(x) = 1$ or omit an eigenvalue.

**Trap 4: Misidentifying Jordan block sizes from the geometric multiplicity alone.**
The number of Jordan blocks for a given eigenvalue $\lambda$ equals the geometric multiplicity $\dim(E_\lambda)$. But the sizes of those blocks are not all size 1 — they can be larger. You must compute $(A - \lambda I)^2$, $(A - \lambda I)^3$, etc., to find the sizes. A single-size heuristic ("$m$ blocks of equal size $k$") is tempting but wrong unless explicitly stated.