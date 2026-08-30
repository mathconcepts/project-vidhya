---
# Alternative body for z-transform.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: z-transform.worked-example.shaken
concept_id: z-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: z-transform.worked-example
for_stance: shaken
---

**Forward transform.** For $x[n]=a^nu[n]$, only $n\geq0$ contributes:

$$X(z)=\sum_{n=0}^{\infty}a^nz^{-n}=\sum_{n=0}^\infty\left(\frac{a}{z}\right)^n$$

That is a geometric series with ratio $r=a/z$. It converges when $|r|<1$, i.e. $|z|>|a|$, and sums to $\dfrac{1}{1-r}$:

$$X(z)=\frac{1}{1-a/z}=\frac{z}{z-a},\quad\text{ROC: }|z|>|a|$$

**Invert $\dfrac{1}{1-0.5z^{-1}}$, given ROC $|z|>0.5$.** Rewrite it in $z$:

$$X(z)=\frac{1}{1-0.5z^{-1}}=\frac{z}{z-0.5}$$

Compare directly to the forward result with $a=0.5$:

$$x[n]=(0.5)^n u[n]$$

Check it: the ROC $|z|>0.5$ is the exterior of a circle, and the forward step already tied that shape to a right-sided, causal sequence — consistent with the $u[n]$ in the answer.

Hold onto this: the same algebraic shape $z/(z-a)$ can name a causal or an anti-causal sequence, and only the ROC tells you which one you have.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: inverting the z-transform of 1/(1-0.5z⁻¹)","steps":[{"prompt":"Write the Z-transform sum for x[n] = aⁿu[n] and identify it as a geometric series. What is the ratio, and what condition ensures convergence?","hint":"X(z) = ∑_{n=0}^∞ aⁿ z^{−n} = ∑_{n=0}^∞ (a/z)ⁿ. This is a geometric series ∑ rⁿ with r = a/z. The series converges when |r| < 1.","answer":"The ratio is r = a/z. Convergence requires |a/z| < 1, i.e., |z| > |a|. Summing: X(z) = 1/(1 − a/z) = z/(z − a). The ROC is the region outside the circle of radius |a|."},{"prompt":"Given X(z) = 1/(1 − 0.5z⁻¹) with ROC |z| > 0.5, identify the inverse Z-transform without computing an integral.","hint":"Rewrite as z/(z − 0.5). Compare with the standard pair z/(z − a) ↔ aⁿu[n]. The ROC being the exterior confirms a causal (right-sided) sequence.","answer":"With a = 0.5, the inverse Z-transform is x[n] = (0.5)ⁿ u[n] = (1/2)ⁿ u[n]."}]}
```
