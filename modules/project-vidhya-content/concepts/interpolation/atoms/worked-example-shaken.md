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
id: interpolation.worked_example.shaken
concept_id: interpolation
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: interpolation.worked_example
for_stance: shaken
---

Stop once all three basis values are found and combined — that is the whole computation, nothing left to refine after.

$$L_1(1.5)=\frac{(1.5-2)(1.5-3)}{(1-2)(1-3)}=\frac{0.75}{2}=0.375$$

$$L_2(1.5)=\frac{(1.5-1)(1.5-3)}{(2-1)(2-3)}=\frac{-0.75}{-1}=0.75$$

$$L_3(1.5)=\frac{(1.5-1)(1.5-2)}{(3-1)(3-2)}=\frac{-0.25}{2}=-0.125$$

$$P(1.5)=2(0.375)+4(0.75)+8(-0.125)=2.75$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Lagrange interpolation at x = 1.5","steps":[{"prompt":"Step 1: Set up the Lagrange basis polynomial $L_1(x)$ for point 1. What is the denominator $(x_1 - x_2)(x_1 - x_3)$?","hint":"$x_1 = 1, x_2 = 2, x_3 = 3$. Multiply $(1-2) \\times (1-3)$.","answer":"$(1-2)(1-3) = (-1)(-2) = 2$"},{"prompt":"Step 2: Evaluate $L_1(1.5)$ using the basis polynomial $L_1(x) = \\frac{(x-2)(x-3)}{2}$.","hint":"Substitute $x = 1.5$: $L_1(1.5) = \\frac{(1.5-2)(1.5-3)}{2} = \\frac{(-0.5)(-1.5)}{2}$.","answer":"$L_1(1.5) = 0.375$"},{"prompt":"Step 3: Evaluate $L_2(1.5)$ and $L_3(1.5)$, then compute $P(1.5) = 2 \\cdot L_1 + 4 \\cdot L_2 + 8 \\cdot L_3$.","hint":"$L_2(1.5) = 0.75$ and $L_3(1.5) = -0.125$. Compute $2(0.375) + 4(0.75) + 8(-0.125)$.","answer":"$P(1.5) = 0.75 + 3 - 1 = 2.75$"}],"caption":"Lagrange interpolation builds the polynomial systematically from basis functions, each designed to isolate one data point."}
```

