---
# Alternative body for z-transform.worked_example.difference-equation, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: z-transform.worked-example.difference-equation.assured
concept_id: z-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: z-transform.worked-example.difference-equation
for_stance: assured
---

$Y(z)(1 - 0.5z^{-1}) = 1$, so $Y(z) = z/(z-0.5)$ and $y[n] = (0.5)^n u[n]$.

The step that costs marks is the shift property under **non-zero** initial conditions. $\mathcal{Z}\{y[n-1]\} = z^{-1}Y(z)$ is the *unilateral* rule only when $y[-1] = 0$; in general it is $z^{-1}Y(z) + y[-1]$. Here $y[-1] = 0$ makes the extra term vanish, which is why the shortcut passes unpunished — and why it fails on the next question, where a stated $y[-1]$ contributes a constant that shifts the whole solution.

Second distinction: $z/(z-0.5)$ does not determine $y[n]$ on its own. The ROC does. $|z| > 0.5$ gives the causal $(0.5)^n u[n]$; $|z| < 0.5$ gives the anticausal $-(0.5)^n u[-n-1]$ from the identical algebraic expression. Quoting a transform without its ROC is quoting half an answer.

The pole at $0.5$ sits inside the unit circle, so the causal solution decays. That reading is only valid once the ROC has fixed which inverse is meant — stability is a statement about the ROC containing $|z| = 1$, not about pole position alone.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Solve y[n] - 0.5y[n-1] = δ[n]","steps":[{"prompt":"Step 1: Write the Z-Transform of both sides of y[n] - 0.5y[n-1] = δ[n]. Use the time-shift property for y[n-1].","hint":"Apply Z{·} to each term. Recall: Z{y[n-1]} = z^(-1)Y(z) and Z{δ[n]} = 1.","answer":"Y(z) - 0.5·z^(-1)·Y(z) = 1"},{"prompt":"Step 2: Solve for Y(z) by factoring.","hint":"Factor out Y(z) on the left side: Y(z)[1 - 0.5z^(-1)] = 1. Then divide.","answer":"Y(z) = 1/(1 - 0.5z^(-1)) = z/(z - 0.5)"},{"prompt":"Step 3: Identify the inverse Z-Transform. What is y[n]?","hint":"Compare with the standard form Z{a^n·u[n]} = z/(z - a). Here a = 0.5.","answer":"y[n] = (0.5)^n·u[n], meaning y[n] = (0.5)^n for n ≥ 0, and 0 for n < 0"}],"caption":"Pole at z=0.5 < 1 ensures stability: the sequence decays exponentially."}
```
