---
# Alternative body for z-transform.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: z-transform.worked-example.assured
concept_id: z-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: z-transform.worked-example
for_stance: assured
---

$X(z)=\dfrac{z}{z-a}$ for $a^nu[n]$, ROC $|z|>|a|$, follows from summing $\sum(a/z)^n$ in one line — skip re-deriving the convergence condition once $|a/z|<1\Leftrightarrow|z|>|a|$ is automatic.

Inverting $\dfrac{1}{1-0.5z^{-1}}=\dfrac{z}{z-0.5}$ with ROC $|z|>0.5$ needs no separate method — it's the same pair, $a=0.5$, exterior ROC:

$$x[n]=(0.5)^nu[n]$$

The distinction that actually costs marks: the closed form $z/(z-a)$ alone is ambiguous. The exact same expression with ROC $|z|<|a|$ instead inverts to $-a^nu[-n-1]$ — anti-causal, running backward in $n$ rather than decaying forward. An exam item that gives $X(z)$ with no ROC and asks for "the" inverse either has an error or expects both possibilities named.

Fast stability read straight from the pole, no inversion needed: pole at $z=a$ with $|a|<1$ under the causal ROC means a decaying, stable sequence; $|a|>1$ under that same causal choice means unbounded growth, no matter how clean the algebra looks.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: inverting the z-transform of 1/(1-0.5z⁻¹)","steps":[{"prompt":"Write the Z-transform sum for x[n] = aⁿu[n] and identify it as a geometric series. What is the ratio, and what condition ensures convergence?","hint":"X(z) = ∑_{n=0}^∞ aⁿ z^{−n} = ∑_{n=0}^∞ (a/z)ⁿ. This is a geometric series ∑ rⁿ with r = a/z. The series converges when |r| < 1.","answer":"The ratio is r = a/z. Convergence requires |a/z| < 1, i.e., |z| > |a|. Summing: X(z) = 1/(1 − a/z) = z/(z − a). The ROC is the region outside the circle of radius |a|."},{"prompt":"Given X(z) = 1/(1 − 0.5z⁻¹) with ROC |z| > 0.5, identify the inverse Z-transform without computing an integral.","hint":"Rewrite as z/(z − 0.5). Compare with the standard pair z/(z − a) ↔ aⁿu[n]. The ROC being the exterior confirms a causal (right-sided) sequence.","answer":"With a = 0.5, the inverse Z-transform is x[n] = (0.5)ⁿ u[n] = (1/2)ⁿ u[n]."}]}
```
