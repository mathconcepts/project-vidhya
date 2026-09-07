---
id: jordan-normal-form.mnemonic
concept_id: jordan-normal-form
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**Picture a chain gang, not a lineup.** Diagonalizable eigenvectors stand independently, each doing its own scaling. A Jordan chain is roped together instead: the generalized eigenvector $w$ (a stand-in vector used when a real eigenvector is missing) cannot move on its own — it drags the genuine eigenvector $v$ along with it, through $(A-\lambda I)w=v$.

**Count blocks like counting ropes, not prisoners.** For eigenvalue $\lambda$: the number of ropes (blocks) equals the **geometric multiplicity** — in plain words, how many truly independent eigenvector directions $\lambda$ actually gives you, written $\dim\ker(A-\lambda I)$ (the leftover "wiggle room" once you subtract $\lambda I$ from $A$ and solve). The total number of prisoners across all ropes equals the **algebraic multiplicity** — how many times $\lambda$ repeats as a root. The longest rope tells you the exponent of $(x-\lambda)$ in the **minimal polynomial** — the smallest-degree polynomial that still zeroes out the matrix, a trimmed-down cousin of the characteristic polynomial.

$$\#\text{blocks} = \dim\ker(A-\lambda I), \qquad \text{longest block} = \deg_\lambda(\text{minimal polynomial})$$

**Sanity-check reflex:** after assembling $J$, confirm the **trace** of $J$ (the sum of its diagonal entries, written $\operatorname{tr}(J)$) matches the trace of $A$, and that every block's diagonal entry is a genuine eigenvalue of $A$ — a Jordan form failing either check was built on a wrong eigenvector.
