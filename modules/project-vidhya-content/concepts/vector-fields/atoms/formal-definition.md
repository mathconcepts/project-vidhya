---
id: vector-fields.formal-definition
concept_id: vector-fields
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Vector Field (3D)**: A vector field $\mathbf{F}$ is a function that assigns a vector to each point $(x, y, z)$ in space:
$$\mathbf{F}(x, y, z) = P(x, y, z)\mathbf{i} + Q(x, y, z)\mathbf{j} + R(x, y, z)\mathbf{k}$$

where $P$, $Q$, $R$ are scalar functions (the component functions). 

**Gradient Field (Conservative)**: A vector field $\mathbf{F}$ is conservative if it equals the gradient of a scalar potential function $f$:
$$\mathbf{F} = \nabla f = \frac{\partial f}{\partial x}\mathbf{i} + \frac{\partial f}{\partial y}\mathbf{j} + \frac{\partial f}{\partial z}\mathbf{k}$$

For a conservative field, the line integral depends only on endpoints, not the path taken.
