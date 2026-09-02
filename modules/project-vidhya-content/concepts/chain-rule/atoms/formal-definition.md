---
id: chain-rule.formal-definition
concept_id: chain-rule
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Chain Rule**: If $f = g \circ h$, meaning $f(x) = g(h(x))$, then:
$$f'(x) = g'(h(x)) \cdot h'(x)$$

Or in Leibniz notation: If $y = g(u)$ and $u = h(x)$, then:
$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}$$

**Method selector.** Reach for the chain rule the moment one function's output feeds directly into another as its input — $y = g(h(x))$. A tempting but wrong move on GATE is applying the product rule to a composite like $\sin(x^2)$, mistaking the composition for a product of $\sin$ and $x^2$: there is no multiplication here, only one function feeding the other, so $u'v + uv'$ has no second term to compute.
