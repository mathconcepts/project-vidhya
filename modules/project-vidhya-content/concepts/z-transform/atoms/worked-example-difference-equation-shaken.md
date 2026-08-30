---
# Alternative body for z-transform.worked_example.difference-equation, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit.
id: z-transform.worked-example.difference-equation.shaken
concept_id: z-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: z-transform.worked-example.difference-equation
for_stance: shaken
---

Solve $y[n] - 0.5y[n-1] = \delta[n]$, with $y[-1] = 0$.

**Run the recursion by hand first.** $y[0] = 0.5(0) + 1 = 1$. Then $y[1] = 0.5(1) = 0.5$, $y[2] = 0.25$, $y[3] = 0.125$. Each term is half the one before.

**Now get there by transform.** Delaying by one sample multiplies the transform by $z^{-1}$, so $Y(z) - 0.5z^{-1}Y(z) = 1$, using $\mathcal{Z}\{\delta[n]\} = 1$.

$$Y(z)\left(1 - 0.5z^{-1}\right) = 1 \quad\Longrightarrow\quad Y(z) = \frac{1}{1 - 0.5z^{-1}} = \frac{z}{z - 0.5}$$

**Read it off the table.** $\dfrac{z}{z-a}$ inverts back to $a^n u[n]$. With $a = 0.5$:

$$y[n] = (0.5)^n u[n]$$

**Check against the hand computation.** $(0.5)^0 = 1$, $(0.5)^1 = 0.5$, $(0.5)^2 = 0.25$. They match.

**Hold onto this.** The transform converts the recursion into ordinary algebra; the table converts it back.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Solve y[n] - 0.5y[n-1] = δ[n]","steps":[{"prompt":"Step 1: Write the Z-Transform of both sides of y[n] - 0.5y[n-1] = δ[n]. Use the time-shift property for y[n-1].","hint":"Apply Z{·} to each term. Recall: Z{y[n-1]} = z^(-1)Y(z) and Z{δ[n]} = 1.","answer":"Y(z) - 0.5·z^(-1)·Y(z) = 1"},{"prompt":"Step 2: Solve for Y(z) by factoring.","hint":"Factor out Y(z) on the left side: Y(z)[1 - 0.5z^(-1)] = 1. Then divide.","answer":"Y(z) = 1/(1 - 0.5z^(-1)) = z/(z - 0.5)"},{"prompt":"Step 3: Identify the inverse Z-Transform. What is y[n]?","hint":"Compare with the standard form Z{a^n·u[n]} = z/(z - a). Here a = 0.5.","answer":"y[n] = (0.5)^n·u[n], meaning y[n] = (0.5)^n for n ≥ 0, and 0 for n < 0"}],"caption":"Pole at z=0.5 < 1 ensures stability: the sequence decays exponentially."}
```
