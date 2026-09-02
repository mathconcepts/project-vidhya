---
id: product-quotient-rule.formal-definition
concept_id: product-quotient-rule
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Product Rule**: If $f(x) = u(x) \cdot v(x)$, then:
$$f'(x) = u'(x) \cdot v(x) + u(x) \cdot v'(x)$$

**Quotient Rule**: If $f(x) = \frac{u(x)}{v(x)}$, then:
$$f'(x) = \frac{u'(x) \cdot v(x) - u(x) \cdot v'(x)}{[v(x)]^2}$$

**Method selector.** Use the quotient rule when the expression is presented as a single irreducible ratio of two $x$-dependent pieces. A common wrong shortcut is rewriting $u/v$ as $u\cdot v^{-1}$ and applying only the product rule, forgetting that $v^{-1}$ itself needs the chain rule — that missing step is exactly what the quotient rule's $-uv'$ term already packages, so skipping it silently drops a factor.
