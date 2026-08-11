---
id: line-integrals.formal-definition
concept_id: line-integrals
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Line Integral of a Vector Field**: Along a curve $C$ parameterized by $\mathbf{r}(t) = x(t)\mathbf{i} + y(t)\mathbf{j} + z(t)\mathbf{k}$ for $t \in [a, b]$, the line integral of $\mathbf{F}$ is:
$$\int_C \mathbf{F} \cdot d\mathbf{r} = \int_a^b \mathbf{F}(\mathbf{r}(t)) \cdot \frac{d\mathbf{r}}{dt} dt = \int_a^b [P(x(t), y(t), z(t))x'(t) + Q(x(t), y(t), z(t))y'(t) + R(x(t), y(t), z(t))z'(t)] dt$$

**Path Independence**: If $\mathbf{F}$ is conservative (i.e., $\mathbf{F} = \nabla f$), then:
$$\int_C \mathbf{F} \cdot d\mathbf{r} = f(\text{endpoint}) - f(\text{startpoint})$$

regardless of the path $C$ connecting them. This is the **Fundamental Theorem of Line Integrals**.
