---
# Alternative body for derivatives-basic.worked_example.product-rule, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit.
id: derivatives-basic.worked-example.product-rule.shaken
concept_id: derivatives-basic
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: derivatives-basic.worked-example.product-rule
for_stance: shaken
---

Two things multiplied: $x^2$ and $\sin x$.

Differentiate each on its own. $\frac{d}{dx}x^2 = 2x$, and $\frac{d}{dx}\sin x = \cos x$.

Now assemble with $(fg)' = f'g + fg'$, taking $f = x^2$ and $g = \sin x$:

$$(2x)(\sin x) + (x^2)(\cos x)$$

Stop there. $2x\sin x$ and $x^2\cos x$ are unlike, so nothing collects.

Check at $x = \tfrac{\pi}{2}$, where $\sin = 1$ and $\cos = 0$: the answer is $\pi$.

**Hold onto this.** A product never differentiates factor by factor.

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
