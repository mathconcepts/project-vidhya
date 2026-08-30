---
# Alternative body for fourier-series.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: fourier-series.worked-example.shaken
concept_id: fourier-series
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: fourier-series-worked-example
for_stance: shaken
---

$f(x)=x$ is odd, so $a_0=0$ and every $a_n=0$ — only $b_n$ survives:

$$b_n=\frac{2}{\pi}\int_0^{\pi}x\sin(nx)\,dx$$

Integrate by parts, $u=x$, $dv=\sin(nx)\,dx$, so $du=dx$, $v=-\cos(nx)/n$:

$$b_n=\frac{2}{\pi}\left[-\frac{x\cos(nx)}{n}\Big|_0^{\pi}+\int_0^{\pi}\frac{\cos(nx)}{n}\,dx\right]$$

The boundary piece is $-\dfrac{\pi\cos(n\pi)}{n}=-\dfrac{\pi(-1)^n}{n}$. The leftover integral is $\dfrac{\sin(nx)}{n^2}\Big|_0^{\pi}=0$, since $\sin(n\pi)=0$. So

$$b_n=\frac{2}{\pi}\left(-\frac{\pi(-1)^n}{n}\right)=\frac{2(-1)^{n+1}}{n}$$

giving the series $f(x)=2\sum_{n=1}^\infty \dfrac{(-1)^{n+1}}{n}\sin(nx)$.

Check it at $x=\pi$: every $\sin(n\pi)=0$, so the series gives $0$ there. The periodic copy of $f$ jumps between $\pi$ and $-\pi$ at that point, and the average of those two values is also $0$ — the series and the jump agree.

Hold onto this: check symmetry before writing the first integral, not after.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Fourier series coefficients for f(x) = x","steps":[{"prompt":"f(x) = x on (−π, π). Before computing any integral, which Fourier coefficients are zero and why?","hint":"Check the symmetry of f(x) = x. Is it even, odd, or neither? Recall that for an odd function on a symmetric interval, the mean is zero and every cosine coefficient vanishes.","answer":"f(x) = x is odd: f(−x) = −x = −f(x). Therefore a₀ = 0 and aₙ = 0 for all n. Only the sine coefficients bₙ are potentially non-zero."},{"prompt":"Compute bₙ using integration by parts and write the full Fourier series.","hint":"Use the half-range formula bₙ = (2/π)∫₀^π x sin(nx) dx. Let u = x, dv = sin(nx)dx. After integration by parts the boundary term gives −π(−1)ⁿ/n and the remaining integral is zero.","answer":"bₙ = 2(−1)^{n+1}/n. The series is f(x) = 2∑(n=1 to ∞) (−1)^{n+1}/n · sin(nx) = 2(sin x − sin(2x)/2 + sin(3x)/3 − …)."}]}
```
