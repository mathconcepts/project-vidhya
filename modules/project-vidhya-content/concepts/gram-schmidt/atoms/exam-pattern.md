---
id: gram-schmidt.exam-pattern
concept_id: gram-schmidt
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **It rarely asks for a full three-vector orthonormalization.** That is a five-minute computation worth two marks — bad economics for the setter as well as for you. What actually appears:
  - "Find $u_2$" (one step only)
  - "Which of these is an orthonormal basis for the span?" — check, don't construct
  - QR-flavoured: $Q$ has the $e_i$ as columns, $R$ is upper triangular with $r_{ii} = \|u_i\|$
  - The projection of a vector onto a subspace, which is the same formula wearing a different name

- **Check before you construct.** Always test the given vectors for orthogonality first. For $v_1 = (1,1,0)^T$ and $v_2 = (2,0,1)^T$: $\langle v_1, v_2\rangle = 2 \neq 0$, so work is needed. The coefficient is $\frac{\langle v_2, v_1\rangle}{\langle v_1, v_1\rangle} = \frac{2}{2} = 1$, giving

  $$u_2 = \begin{pmatrix} 2 \\ 0 \\ 1\end{pmatrix} - 1\cdot\begin{pmatrix} 1 \\ 1 \\ 0\end{pmatrix} = \begin{pmatrix} 1 \\ -1 \\ 1\end{pmatrix}$$

  Check $\langle v_1, u_2\rangle = 1 - 1 + 0 = 0$ ✓. Normalized: $e_1 = \tfrac{1}{\sqrt2}(1,1,0)^T$, $e_2 = \tfrac{1}{\sqrt3}(1,-1,1)^T$ (verified). If the dot product had come out $0$, the whole question would have collapsed to two normalizations.

- **The silent trap: project onto $u_j$, never onto $v_j$.** At step $i$ you subtract projections onto the *already orthogonalized* $u_1,\dots,u_{i-1}$, not onto the original inputs. Using $v_j$ produces a perfectly clean-looking vector that is simply not orthogonal — and nothing in the arithmetic warns you. This costs more marks than any other error on this topic.

- **The other trap: $\|u\|$ vs $\langle u,u\rangle$ in the denominator.** The unit-vector form $\langle v, e_j\rangle e_j$ and the general form $\frac{\langle v,u_j\rangle}{\langle u_j,u_j\rangle}u_j$ are both correct; mixing them is not. Pick one and stay in it for the whole question.

- **MSQ trap: "the Gram-Schmidt output is unique."** False as stated — reorder the inputs and you get a different orthonormal basis, equally valid. It is unique only *given a fixed input order* (and a sign convention).

- **Verification reflex, and it is cheap:** before writing the final answer, dot every pair. Two dot products on a $3$-vector answer cost 15 seconds and catch the $u_j$-vs-$v_j$ mistake outright.

- **Time budget:** one orthogonalization step under 60 seconds. If radicals have appeared before your last step, you normalized too early — restart with unnormalized vectors.
