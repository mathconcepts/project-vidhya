---
id: line-integrals.common-traps
concept_id: line-integrals
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting to parameterize**: Students write $\int_C F_x dx + F_y dy$ and then try to integrate without substituting the parameterization. You *must* express $x(t), y(t), dx, dy$ in terms of $t$ before integrating.

- **Mixing up $\int_C f \, ds$ with $\int_C \mathbf{F} \cdot d\mathbf{r}$**: The first uses arc-length $ds = |\mathbf{r}'(t)| dt$ and is scalar (integrand is a number). The second uses the differential vector $d\mathbf{r} = \mathbf{r}'(t) dt$ and computes a dot product. Don't substitute one formula into the other problem.

- **Not checking conservativeness first**: Students laboriously compute $\int_C (3x^2) dx + (3y^2) dy$ along a complex path when they should notice $\nabla \times \mathbf{F} = 0$ and use the Fundamental Theorem in 10 seconds.
