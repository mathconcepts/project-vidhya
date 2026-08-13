---
id: vector-fields-intuition
concept_id: vector-fields
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# What Is a Vector Field?

A **vector field** $\mathbf{F}$ assigns a vector to every point in space:

$$\mathbf{F}(x, y, z) = F_x(x,y,z)\,\hat{i} + F_y(x,y,z)\,\hat{j} + F_z(x,y,z)\,\hat{k}$$

Think of it as a rule: "at this location, the force (or velocity, or whatever) points *this* direction with *this* magnitude."

---

## Line Integrals — Work Done Along a Curve

The **line integral** of $\mathbf{F}$ along a curve $C$ measures work:

$$\int_C \mathbf{F} \cdot d\mathbf{r} = \int_C (F_x\,dx + F_y\,dy + F_z\,dz)$$

- If $\mathbf{F}$ is a force field, this is the total work done as a particle moves along $C$.
- The dot product $\mathbf{F} \cdot d\mathbf{r}$ picks out only the component of $\mathbf{F}$ *along* the path.

---

## Conservative Fields and Scalar Potential

A vector field is **conservative** if there exists a scalar function $\phi$ (the potential) such that:

$$\mathbf{F} = \nabla \phi = \left(\frac{\partial\phi}{\partial x},\, \frac{\partial\phi}{\partial y},\, \frac{\partial\phi}{\partial z}\right)$$

**Key consequence:** The line integral depends only on endpoints, not on the path:

$$\int_C \mathbf{F} \cdot d\mathbf{r} = \phi(B) - \phi(A)$$

This is the vector-calculus version of the fundamental theorem of calculus.

---

## How to Tell if a Field Is Conservative

In a **simply connected region** (no holes), $\mathbf{F}$ is conservative **if and only if**:

$$\nabla \times \mathbf{F} = \mathbf{0} \qquad \text{(curl is zero everywhere)}$$

This is the GATE test. Check all three components of the curl; if each is zero, the field is conservative and you can find $\phi$ by integration.

---

## Quick Reference

| Property | Condition | Implication |
|---|---|---|
| Conservative | $\nabla \times \mathbf{F} = 0$ (simply connected) | Path-independent line integrals |
| Irrotational | $\nabla \times \mathbf{F} = 0$ | No net rotation in the field |
| Solenoidal | $\nabla \cdot \mathbf{F} = 0$ | No sources or sinks |
| Gradient field | $\mathbf{F} = \nabla\phi$ | Conservative + potential exists |

> **GATE tip:** On a closed path, $\oint_C \mathbf{F} \cdot d\mathbf{r} = 0$ if and only if $\mathbf{F}$ is conservative. This is a common MCQ check.
