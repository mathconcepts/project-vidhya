---
id: lu-factorization.exam-pattern
concept_id: lu-factorization
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions almost never want the whole factorization.** They ask for *one entry* — "the value of $u_{33}$", "the value of $\ell_{32}$". Compute only the elimination steps that reach that entry and stop.

  For $A = \begin{pmatrix} 2 & -1 & 0 \\ 4 & 3 & 1 \\ 2 & 1 & 3 \end{pmatrix}$: $\ell_{21} = 4/2 = 2$, $\ell_{31} = 2/2 = 1$ in one glance. Only if $u_{33}$ is asked do you finish the second column ($\ell_{32} = 2/5$, $u_{33} = 13/5$).

- **Read the convention before you compute.** Doolittle puts the 1s on $L$'s diagonal; Crout puts them on $U$'s. The same $A$ gives *different* correct answers under the two conventions, and GATE states which one it wants in the stem. Answering under the wrong convention is a whole mark lost on correct arithmetic.

- **The determinant shortcut is the hidden question.** "Using LU, find $\det A$" is really "multiply $U$'s diagonal": $2 \cdot 5 \cdot \tfrac{13}{5} = 26$. **Trap:** if the factorization required a row swap, it's $PA = LU$ and $\det A = (-1)^s \prod u_{ii}$ for $s$ swaps. Forgetting the sign is the single most common loss here.

- **MCQ existence questions:** $A$ has an LU factorization *without pivoting* iff every leading principal minor is nonzero. The stock counterexample is $\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$ — invertible, but no LU, because the first pivot is $0$.

- **Time budget:** a $3\times3$ Doolittle factorization is a 90-second problem. A single requested entry should cost under 40 seconds. If you're inverting anything, you've misread the question.
