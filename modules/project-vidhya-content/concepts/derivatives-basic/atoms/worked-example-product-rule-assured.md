---
# Alternative body for derivatives-basic.worked_example.product-rule, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: derivatives-basic.worked-example.product-rule.assured
concept_id: derivatives-basic
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: derivatives-basic.worked-example.product-rule
for_stance: assured
---

$(x^2\sin x)' = 2x\sin x + x^2\cos x$.

The distinction worth holding: $(fg)' \ne f'g'$. Test it here — $f'g' = 2x\cos x$, a single term, against the correct two. The false version is not a rounding error, it is a different function.

The habit that survives pressure is bracketing the four pieces before writing anything: $f, f', g, g'$. Sign slips arrive through $g'$, since $(\cos x)' = -\sin x$ carries a minus that $(\sin x)' = \cos x$ does not.

Two extensions with the same skeleton. Three factors: $(fgh)' = f'gh + fg'h + fgh'$ — differentiate each slot in turn, never all at once. And the quotient rule is this rule with $g^{-1}$ substituted in, which is why its numerator is a **difference**: the chain rule on $g^{-1}$ produces $-g'/g^2$, and that minus is inherited, not decorative. Reconstructing the quotient rule from the product rule beats memorising its order, because the order is exactly what gets transposed under time pressure.

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
