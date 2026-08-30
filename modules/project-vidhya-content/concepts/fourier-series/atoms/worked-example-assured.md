---
# Alternative body for fourier-series.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: fourier-series-worked-example.assured
concept_id: fourier-series
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: fourier-series-worked-example
for_stance: assured
---

$f(x)=x$ on $(-\pi,\pi)$ is odd, so $a_0=a_n=0$ and $b_n=\frac{2}{\pi}\int_0^\pi x\sin(nx)\,dx=\frac{2(-1)^{n+1}}{n}$ by one integration by parts — skip re-deriving it once you've done it twice.

The mark that goes missing is at $x=\pm\pi$: the periodic extension jumps from $\pi$ to $-\pi$ there, and the series converges to the *average*, $0$ — not to $\pi$, not to $-\pi$, and not "undefined." Confirm it fast: $\sin(n\pi)=0$ for every $n$, so the series itself reads $0$ at that point, matching the average without summing anything.

This is also the standard route into $\sum 1/n^2$: Parseval with $L=\pi$ gives $\frac{1}{\pi}\int_{-\pi}^{\pi}x^2\,dx=\sum b_n^2=\sum 4/n^2$, and $\frac{1}{\pi}\cdot\frac{2\pi^3}{3}=\frac{2\pi^2}{3}$ forces $\sum 1/n^2=\pi^2/6$ — recognise the pattern "Parseval applied to a polynomial" rather than re-summing from scratch.

If the interval were $(-L,L)$ instead of $(-\pi,\pi)$, the same odd argument holds, but $n\pi x/L$ replaces $nx$ throughout — forgetting the rescale is the common error when the problem changes the period.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Fourier series coefficients for f(x) = x","steps":[{"prompt":"f(x) = x on (−π, π). Before computing any integral, which Fourier coefficients are zero and why?","hint":"Check the symmetry of f(x) = x. Is it even, odd, or neither? Recall that for an odd function on a symmetric interval, the mean is zero and every cosine coefficient vanishes.","answer":"f(x) = x is odd: f(−x) = −x = −f(x). Therefore a₀ = 0 and aₙ = 0 for all n. Only the sine coefficients bₙ are potentially non-zero."},{"prompt":"Compute bₙ using integration by parts and write the full Fourier series.","hint":"Use the half-range formula bₙ = (2/π)∫₀^π x sin(nx) dx. Let u = x, dv = sin(nx)dx. After integration by parts the boundary term gives −π(−1)ⁿ/n and the remaining integral is zero.","answer":"bₙ = 2(−1)^{n+1}/n. The series is f(x) = 2∑(n=1 to ∞) (−1)^{n+1}/n · sin(nx) = 2(sin x − sin(2x)/2 + sin(3x)/3 − …)."}]}
```
