---
# Alternative body for laplace-transform.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: laplace-transform-worked-example.shaken
concept_id: laplace-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: laplace-transform-worked-example
for_stance: shaken
---

Transform each term with $y(0)=1$, $y'(0)=0$:

$$\mathcal L\{y''\}=s^2Y-s(1)-0,\quad \mathcal L\{y'\}=sY-1,\quad \mathcal L\{y\}=Y$$

Substitute into the equation:

$$(s^2Y-s)+3(sY-1)+2Y=0\ \Longrightarrow\ Y(s^2+3s+2)=s+3$$

Solve for $Y(s)$ and factor the denominator:

$$Y(s)=\frac{s+3}{(s+1)(s+2)}=\frac{A}{s+1}+\frac{B}{s+2}$$

Cover-up: at $s=-1$, $A=\dfrac{-1+3}{-1+2}=2$; at $s=-2$, $B=\dfrac{-2+3}{-2+1}=-1$. So $Y(s)=\dfrac{2}{s+1}-\dfrac{1}{s+2}$.

Invert term by term with $\mathcal L^{-1}\{1/(s+a)\}=e^{-at}$:

$$y(t)=2e^{-t}-e^{-2t}$$

Check both initial conditions: $y(0)=2-1=1$, matches. $y'(t)=-2e^{-t}+2e^{-2t}$, so $y'(0)=-2+2=0$, matches too.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y'' + 3y' + 2y = 0 via Laplace transform","steps":[{"prompt":"Apply the Laplace transform to y'' + 3y' + 2y = 0 with y(0)=1 and y'(0)=0. What algebraic equation do you get for Y(s)?","hint":"Use L{y''} = s²Y − s·y(0) − y'(0) = s²Y − s, and L{y'} = sY − y(0) = sY − 1. Collect all Y(s) terms on the left.","answer":"(s² + 3s + 2)Y(s) = s + 3"},{"prompt":"Factor the denominator and decompose Y(s) = (s+3)/((s+1)(s+2)) into partial fractions A/(s+1) + B/(s+2). Find A and B.","hint":"Cover-up: set s = −1 to find A, set s = −2 to find B. A = (−1+3)/(−1+2) = 2. B = (−2+3)/(−2+1) = −1.","answer":"A = 2, B = −1; so Y(s) = 2/(s+1) − 1/(s+2)"},{"prompt":"Invert Y(s) = 2/(s+1) − 1/(s+2) to obtain y(t), and verify both initial conditions.","hint":"Use L⁻¹{1/(s+a)} = e^(−at). Check y(0) = 2·1 − 1·1 and y'(0) = 2·(−1) + 1·(−1)·(−1) ... compute y'(t) = −2e^(−t) + 2e^(−2t).","answer":"y(t) = 2e^(−t) − e^(−2t); y(0) = 2 − 1 = 1 ✓, y'(0) = −2 + 2 = 0 ✓"}]}
```
