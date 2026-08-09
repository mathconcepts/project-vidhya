---
id: differentiability.formal-definition
concept_id: differentiability
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Differentiability at a Point**: A function $f$ is differentiable at $x = a$ if the derivative $f'(a)$ exists, defined as:
$$f'(a) = \lim_{h \to 0} \frac{f(a+h) - f(a)}{h}$$

This limit, if it exists and is finite, gives the slope of the tangent line to the curve at $x = a$.

**Relationship to Continuity**: If $f$ is differentiable at $a$, then $f$ is continuous at $a$. Converse is false: continuity does not imply differentiability (e.g., $|x|$ is continuous but not differentiable at $x = 0$).

**Differentiability on an Interval**: $f$ is differentiable on $(a,b)$ if it is differentiable at every point in the interval. $f$ is differentiable on $[a,b]$ if it is differentiable on $(a,b)$ and the one-sided derivatives at the endpoints exist.
