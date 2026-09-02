---
# Alternative body for matrix-norms.worked-example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinction that actually costs
# marks (spectral norm vs. spectral radius on a triangular matrix).
id: matrix-norms.worked-example.assured
concept_id: matrix-norms
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-norms.worked-example
for_stance: assured
---

**Problem:** $\|A\|_F$, $\|A\|_1$, $\kappa_2(A)$ for $A=\begin{pmatrix}4&1\\0&2\end{pmatrix}$.

**Entrywise norms, direct.** $\|A\|_F=\sqrt{16+1+0+4}=\sqrt{21}\approx4.58$. Column sums $4,3\Rightarrow\|A\|_1=4$ — no eigenvalue work needed for either.

**Spectral norm needs $A^TA$.** $A^TA=\begin{pmatrix}16&4\\4&5\end{pmatrix}$, $\operatorname{tr}=21$, $\det=64\Rightarrow\lambda^2-21\lambda+64=0$. By the trace/det shortcut, no need to expand $(16-\lambda)(5-\lambda)-16$ term by term: $\lambda\approx17.30,\,3.70$, so $\sigma_1\approx4.16$, $\sigma_2\approx1.92$.

$$\boxed{\|A\|_F\approx4.58,\ \|A\|_1=4,\ \kappa_2(A)=\sigma_1/\sigma_2\approx2.16}$$

**Worth knowing.** $A$ is upper-triangular, so its own eigenvalues sit at $4,2$ directly on the diagonal — yet $\|A\|_2\approx4.16\neq4=\rho(A)$. Spectral norm and spectral radius coincide only when $A^T=A$ (more generally, $A$ normal); triangular alone isn't enough.
