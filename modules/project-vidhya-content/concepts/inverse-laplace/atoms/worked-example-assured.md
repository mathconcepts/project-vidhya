---
# Alternative body for inverse-laplace.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: inverse-laplace.worked-example.assured
concept_id: inverse-laplace
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: inverse-laplace-worked-example
for_stance: assured
---

$\dfrac{s+2}{(s+1)(s^2+4)}$ resolves to $\dfrac{1/5}{s+1}+\dfrac{-s/5+6/5}{s^2+4}$ the moment $A=1/5$ falls out of substituting $s=-1$; treat that substitution as arithmetic, not a step worth narrating.

$$f(t)=\frac15e^{-t}-\frac15\cos 2t+\frac35\sin 2t,\quad t\geq0$$

What deserves scrutiny is the rescale that follows, not the decomposition itself: $\dfrac{6/5}{s^2+4}$ is not $\dfrac{6}{5}\sin2t$. The sine pair needs $\omega$ sitting in the numerator, so pull it out first — $\frac35\cdot\frac{2}{s^2+4}\to\frac35\sin2t$. Missing that rescale is the error that survives a fully correct partial-fraction line and still costs the mark.

Every pole has non-positive real part here — $s=-1$ real and stable, $s=\pm2j$ an undamped pair — so $f(t)$ must stay bounded. A pole with positive real part surviving to this stage means an earlier sign error, not a legitimately growing answer.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: inverse Laplace transform via partial fractions","steps":[{"prompt":"Set up the partial fraction decomposition for (s+2) / [(s+1)(s²+4)]. What form do you write, and what is the value of A?","hint":"The linear factor (s+1) contributes A/(s+1). The irreducible quadratic (s²+4) contributes (Bs+C)/(s²+4). To find A, substitute s = −1 into both sides after multiplying through by (s+1)(s²+4).","answer":"Write A/(s+1) + (Bs+C)/(s²+4). Setting s = −1 gives 1 = A·5, so A = 1/5. Equating s² coefficients gives B = −1/5; equating s¹ coefficients gives C = 6/5."},{"prompt":"Rewrite the partial fractions in standard table form and state f(t).","hint":"Split (−s/5 + 6/5)/(s²+4) into −(1/5)·s/(s²+4) plus (3/5)·2/(s²+4) to match the cosine and sine table pairs with ω = 2.","answer":"f(t) = (1/5)e^{−t} − (1/5)cos(2t) + (3/5)sin(2t) for t ≥ 0."}]}
```
