---
id: gram-schmidt.exam-pattern
concept_id: gram-schmidt
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions usually want one coordinate, not the whole basis.** "The second coordinate of the orthonormal vector obtained from $v_2$" is a single value pulled from $e_2$ — don't run the full process and then hunt for the number if the stem already narrows the ask.

- **MCQ "which set is orthonormal" tests two properties in one glance.** Check dot products pairwise for zero *and* each vector's norm for one. A set that's orthogonal but not normalized (norms $\neq 1$) is a standard wrong option.

  Example: $u_1=(1,0,1)$, $u_2=\left(\tfrac12,1,-\tfrac12\right)$ are orthogonal ($u_1\cdot u_2=0$, verified) but $\|u_1\|=\sqrt2\neq1$ — orthogonal, not orthonormal, until both are divided by their own norms.

- **The trap GATE likes: skipping a projection term.** On a 3-vector question, the most common wrong answer comes from computing $u_3 = v_3 - \text{proj}_{u_1}v_3$ and forgetting the $-\text{proj}_{u_2}v_3$ term entirely. The stem is often built so this shortcut still looks numerically plausible.

- **QR framing.** "Find $Q$ and $R$ such that $A=QR$" for a matrix with independent columns is exactly this computation: $Q$'s columns are your $e_i$'s, and $R$ is upper triangular with the projection coefficients you already found along the way — recognizing the disguise saves re-deriving anything.

- **Time budget:** two vectors in $\mathbb{R}^2$ or $\mathbb{R}^3$ is under 90 seconds. Three vectors with clean fractions runs 3–4 minutes; if the numbers stop simplifying, re-check the projection coefficient before continuing.
