---
id: integration-substitution.visual-analogy
concept_id: integration-substitution
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

## The Unwrapping Analogy

Imagine a composite function as a wrapped gift—the inner function is the box, the outer function is the wrapping. Differentiation tears through the layers via the chain rule. Integration by substitution reverses this: you **unwrap the layers** to see the simple core.

When you see $\sin(2x)$, the "2x" is the inner wrapping. If the integrand has $\sin(2x)$ paired with a "2" (the derivative of 2x), substitution $u = 2x$ unwraps it instantly: $\int 2\sin(2x) \, dx = -\cos(u) + C = -\cos(2x) + C$.

The visualization below shows a composite function oscillating at twice the rate. Substitution compresses this scaled behavior into standard form—the gift unwrapped.

```gif-scene
{"type":"function-trace","expression":"sin(2*x)","x_range":[-3.14,3.14],"y_range":[-1.5,1.5],"frames":30,"fps":12}
```

**Key insight:** Look for the "wrapper factor" in the derivative. If it's there, substitution is your unwrapping tool.
```

**File 3:
