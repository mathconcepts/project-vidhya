---
id: matrix-norms.exam-pattern
concept_id: matrix-norms
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT: "compute $\|A\|_F$ (or $\|A\|_1$/$\|A\|_\infty$) for a given matrix."** Pure definition-plug-in, no eigenvalues needed.

  Example: $A=\begin{pmatrix}4&1\\0&2\end{pmatrix}$: $\|A\|_F=\sqrt{16+1+0+4}=\sqrt{21}\approx4.58$ — read straight off the entries.

- **NAT/MCQ on the condition number, usually via singular values already given or an easy $A^TA$.** For a symmetric or diagonal $A$, $\kappa_2(A)$ is a one-line ratio of $|$eigenvalues$|$ — check whether $A$ is symmetric before reaching for $A^TA$.

- **MSQ "true/false" on norm properties.** Common statements tested: $\kappa(A)\geq1$ (true, always); $\|A\|_2=\rho(A)$ (true only for symmetric/normal $A$); $\kappa(cA)=\kappa(A)$ for scalar $c\neq0$ (true — condition number is scale-invariant).

- **A frequent framing device, not a computation:** the question describes an ill-conditioned system narratively (small perturbations causing large solution changes) and asks which quantity explains it — the expected answer is condition number, not determinant.

- **Time budget:** a $2\times2$ Frobenius or induced-1/∞ norm should take under $60$ seconds. A spectral norm requiring eigenvalues of $A^TA$ needs the full $90$–$120$ seconds a $2\times2$ eigenvalue problem takes.
