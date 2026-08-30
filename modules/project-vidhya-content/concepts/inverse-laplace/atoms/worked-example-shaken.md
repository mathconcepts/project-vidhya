---
# Alternative body for inverse-laplace.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: inverse-laplace.worked-example.shaken
concept_id: inverse-laplace
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: inverse-laplace-worked-example
for_stance: shaken
---

Set up partial fractions:

$$\frac{s+2}{(s+1)(s^2+4)}=\frac{A}{s+1}+\frac{Bs+C}{s^2+4}$$

Multiply both sides by $(s+1)(s^2+4)$: $s+2=A(s^2+4)+(Bs+C)(s+1)$.

Plug in $s=-1$, which kills the second term on the right:

$$1=5A\ \Longrightarrow\ A=\frac15$$

Expand the rest and match coefficients of $s^2$ and $s^1$:

$$A+B=0\ \Rightarrow\ B=-\frac15,\qquad B+C=1\ \Rightarrow\ C=\frac65$$

So $F(s)=\dfrac{1/5}{s+1}+\dfrac{-s/5+6/5}{s^2+4}$. Split the second piece to match the cosine and sine pairs with $\omega=2$:

$$-\frac15\cdot\frac{s}{s^2+4}+\frac35\cdot\frac{2}{s^2+4}$$

Every piece is now a table entry — $\dfrac{1}{s+a}\to e^{-at}$, $\dfrac{s}{s^2+\omega^2}\to\cos\omega t$, $\dfrac{\omega}{s^2+\omega^2}\to\sin\omega t$ — read off one at a time:

$$f(t)=\frac15e^{-t}-\frac15\cos 2t+\frac35\sin 2t,\quad t\geq0$$

Check the poles: $s=-1$ and $s=\pm2j$ both have non-positive real part, so $f(t)$ should stay bounded rather than blow up — it does.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: inverse Laplace transform via partial fractions","steps":[{"prompt":"Set up the partial fraction decomposition for (s+2) / [(s+1)(s²+4)]. What form do you write, and what is the value of A?","hint":"The linear factor (s+1) contributes A/(s+1). The irreducible quadratic (s²+4) contributes (Bs+C)/(s²+4). To find A, substitute s = −1 into both sides after multiplying through by (s+1)(s²+4).","answer":"Write A/(s+1) + (Bs+C)/(s²+4). Setting s = −1 gives 1 = A·5, so A = 1/5. Equating s² coefficients gives B = −1/5; equating s¹ coefficients gives C = 6/5."},{"prompt":"Rewrite the partial fractions in standard table form and state f(t).","hint":"Split (−s/5 + 6/5)/(s²+4) into −(1/5)·s/(s²+4) plus (3/5)·2/(s²+4) to match the cosine and sine table pairs with ω = 2.","answer":"f(t) = (1/5)e^{−t} − (1/5)cos(2t) + (3/5)sin(2t) for t ≥ 0."}]}
```
