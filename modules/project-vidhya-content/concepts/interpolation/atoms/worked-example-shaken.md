---
# Alternative body for interpolation.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: interpolation.worked-example.shaken
concept_id: interpolation
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: interpolation.worked-example
for_stance: shaken
---

Stop once all three basis values are found and combined — nothing else is needed.

$$L_1(1.5)=\frac{(1.5-2)(1.5-3)}{(1-2)(1-3)}=\frac{0.75}{2}=0.375$$

$$L_2(1.5)=\frac{(1.5-1)(1.5-3)}{(2-1)(2-3)}=\frac{-0.75}{-1}=0.75$$

$$L_3(1.5)=\frac{(1.5-1)(1.5-2)}{(3-1)(3-2)}=\frac{-0.25}{2}=-0.125$$

$$P(1.5)=2(0.375)+4(0.75)+8(-0.125)=2.75$$

Check: $0.375+0.75-0.125=1$ — the three basis values always add to exactly $1$, a free check before trusting the final number.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Lagrange interpolation at x = 1.5","steps":[{"prompt":"Step 1: Set up the Lagrange basis polynomial L₁(x) for point 1. What is the denominator (x₁ − x₂)(x₁ − x₃)?","hint":"x₁ = 1, x₂ = 2, x₃ = 3. Multiply (1−2) × (1−3).","answer":"(1-2)(1-3) = (-1)(-2) = 2"},{"prompt":"Step 2: Evaluate L₁(1.5) using L₁(x) = (x-2)(x-3)/2.","hint":"Substitute x = 1.5: L₁(1.5) = (1.5-2)(1.5-3)/2 = (-0.5)(-1.5)/2.","answer":"L₁(1.5) = 0.375"},{"prompt":"Step 3: Evaluate L₂(1.5) and L₃(1.5), then compute P(1.5) = 2·L₁ + 4·L₂ + 8·L₃.","hint":"L₂(1.5) = 0.75 and L₃(1.5) = -0.125. Compute 2(0.375) + 4(0.75) + 8(-0.125).","answer":"P(1.5) = 0.75 + 3 - 1 = 2.75"}],"caption":"The basis weights always sum to 1 — check that before trusting the final combination."}
```
