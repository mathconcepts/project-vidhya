---
id: vector-fields.formal-definition
concept_id: vector-fields
atom_type: formal_definition
bloom_level: 2
difficulty: 0.40
exam_ids: ["*"]
---

A **scalar field** assigns one number $\phi(x,y,z)$ to every point of a region; a **vector field** assigns a vector $\mathbf F(x,y,z)$ to every point. Differentiating a scalar field produces its **gradient field**

$$\nabla\phi = \left(\frac{\partial\phi}{\partial x},\ \frac{\partial\phi}{\partial y},\ \frac{\partial\phi}{\partial z}\right),$$

and any vector field arising this way is called **conservative**, with $\phi$ its **scalar potential**. For a planar field $\mathbf F=(P,Q)$, conservativity on a simply connected domain is equivalent to the mixed-partials condition

$$\frac{\partial Q}{\partial x} = \frac{\partial P}{\partial y}.$$

**Method selector.** Run the mixed-partials test before searching for a potential — it is a two-line check for whether one even exists. Guessing a candidate $\phi$ and differentiating it to see whether it reproduces $\mathbf F$ is the tempting alternative, but a guess that satisfies $\partial\phi/\partial x = P$ while quietly missing $\partial\phi/\partial y = Q$ can survive several lines of algebra unnoticed; the mixed-partials test catches a non-conservative field in one line, before any integration starts.
