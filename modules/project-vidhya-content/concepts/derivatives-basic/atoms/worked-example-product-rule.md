---
id: derivatives-basic.worked-example.product-rule
concept_id: derivatives-basic
atom_type: worked_example
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find $\frac{d}{dx}\left(x^2 \sin x\right)$.

---

**Step 1 — Recognize the structure.** This is a product of two functions: $f(x) = x^2$ and $g(x) = \sin x$. The product rule applies: $(fg)' = f'g + fg'$.

---

**Step 2 — Differentiate each factor.** $f'(x) = 2x$ (power rule). $g'(x) = \cos x$ (standard derivative).

---

**Step 3 — Apply the product rule.** $(fg)' = f'g + fg' = (2x)(\sin x) + (x^2)(\cos x)$.

---

**Step 4 — Simplify.** $\frac{d}{dx}\left(x^2 \sin x\right) = \boxed{2x \sin x + x^2 \cos x}$.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: d/dx (x² sin x)",
  "steps": [
    {
      "prompt": "Step 1: What rule applies to x² · sin x?",
      "hint": "This is a product of two differentiable functions.",
      "answer": "Product rule: (fg)' = f'g + fg', with f = x² and g = sin x."
    },
    {
      "prompt": "Step 2: Differentiate each factor separately.",
      "hint": "Power rule for x², memorised derivative for sin x.",
      "answer": "f'(x) = 2x   (power rule)     g'(x) = cos x   (standard)",
      "eqn": "f'(x) = 2x        g'(x) = cos x"
    },
    {
      "prompt": "Step 3: Apply (fg)' = f'g + fg'. Write the expression.",
      "hint": "Substitute the four pieces: f', g, f, g'.",
      "answer": "(2x)(sin x) + (x²)(cos x)",
      "eqn": "(fg)' = f'g + fg'\n      = (2x)(sin x) + (x²)(cos x)"
    },
    {
      "prompt": "Step 4: State the final simplified answer.",
      "hint": "No further simplification is possible — two unlike terms.",
      "answer": "d/dx (x² sin x) = 2x sin x + x² cos x"
    }
  ]
}
```
