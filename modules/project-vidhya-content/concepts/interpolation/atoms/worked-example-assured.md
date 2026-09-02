---
# Alternative body for interpolation.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: interpolation.worked-example.assured
concept_id: interpolation
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: interpolation.worked-example
for_stance: assured
---

## Confirm the setup, skip the re-derivation

$x=1.5$ sits inside $[1,3]$, the span of the three nodes — interpolation, not extrapolation, so the usual error bound $R(x)=\frac{f'''(\xi)}{3!}(x-1)(x-2)(x-3)$ applies in principle, though it can't be evaluated here since only samples of $f$, not a formula, are given.

$$P(1.5)=2L_1(1.5)+4L_2(1.5)+8L_3(1.5)=2(0.375)+4(0.75)+8(-0.125)=2.75$$

Weight-sum check: $0.375+0.75-0.125=1$, confirming no sign or arithmetic slip in the basis values before they're combined.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Lagrange interpolation at x = 1.5","steps":[{"prompt":"Step 1: Set up the Lagrange basis polynomial L₁(x) for point 1. What is the denominator (x₁ − x₂)(x₁ − x₃)?","hint":"x₁ = 1, x₂ = 2, x₃ = 3. Multiply (1−2) × (1−3).","answer":"(1-2)(1-3) = (-1)(-2) = 2"},{"prompt":"Step 2: Evaluate L₁(1.5) using L₁(x) = (x-2)(x-3)/2.","hint":"Substitute x = 1.5: L₁(1.5) = (1.5-2)(1.5-3)/2 = (-0.5)(-1.5)/2.","answer":"L₁(1.5) = 0.375"},{"prompt":"Step 3: Evaluate L₂(1.5) and L₃(1.5), then compute P(1.5) = 2·L₁ + 4·L₂ + 8·L₃.","hint":"L₂(1.5) = 0.75 and L₃(1.5) = -0.125. Compute 2(0.375) + 4(0.75) + 8(-0.125).","answer":"P(1.5) = 0.75 + 3 - 1 = 2.75"}],"caption":"The basis weights always sum to 1 — check that before trusting the final combination."}
```
