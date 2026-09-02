---
id: jordan-normal-form.mnemonic
concept_id: jordan-normal-form
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**Picture a chain gang, not a lineup.** Diagonalizable eigenvectors stand independently, each doing its own scaling. A Jordan chain is roped together: the generalized eigenvector $w$ can't move without dragging the eigenvector $v$ along too, via $(A-\lambda I)w=v$.

**Count blocks like counting ropes, not prisoners.** For eigenvalue $\lambda$: number of ropes (blocks) = geometric multiplicity = $\dim\ker(A-\lambda I)$. Total prisoners on all ropes = algebraic multiplicity. Longest rope = exponent of $(x-\lambda)$ in the minimal polynomial.

$$\#\text{blocks} = \dim\ker(A-\lambda I), \qquad \text{longest block} = \deg_\lambda(\text{minimal polynomial})$$

**Sanity-check reflex:** after assembling $J$, confirm $\operatorname{tr}(J)$ matches $\operatorname{tr}(A)$ and every block's diagonal entry is a genuine eigenvalue of $A$ — a Jordan form failing either check was built on a wrong eigenvector.
