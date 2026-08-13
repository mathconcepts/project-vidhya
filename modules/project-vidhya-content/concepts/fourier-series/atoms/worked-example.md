---
id: fourier-series-worked-example
concept_id: fourier-series
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Fourier Series — Worked Example

## Problem (GATE style)

Find the Fourier series of $f(x) = x$ on $(-\pi, \pi)$, assuming period $2\pi$.

---

## Step 1 — Identify Symmetry

$f(x) = x$ is an **odd function**: $f(-x) = -x = -f(x)$.

For an odd function on a symmetric interval $(-L, L)$:
- $a_0 = 0$ (mean of an odd function over $[-\pi,\pi]$ is zero)
- $a_n = 0$ for all $n$ (even $\times$ odd = odd; integral over symmetric interval is zero)
- Only $b_n$ coefficients survive

This saves two-thirds of the work immediately.

---

## Step 2 — Compute $b_n$

With $L = \pi$:

$$b_n = \frac{1}{\pi}\int_{-\pi}^{\pi} x\sin(nx)\,dx$$

Since the integrand $x\sin(nx)$ is **even** (odd $\times$ odd = even), use the half-range formula:

$$b_n = \frac{2}{\pi}\int_{0}^{\pi} x\sin(nx)\,dx$$

**Integrate by parts:** $u = x$, $dv = \sin(nx)\,dx$, $du = dx$, $v = -\dfrac{\cos(nx)}{n}$:

$$b_n = \frac{2}{\pi}\left[\left.-\frac{x\cos(nx)}{n}\right|_0^{\pi} + \int_0^{\pi}\frac{\cos(nx)}{n}\,dx\right]$$

Evaluate the boundary term:
$$\left.-\frac{x\cos(nx)}{n}\right|_0^{\pi} = -\frac{\pi\cos(n\pi)}{n} - 0 = -\frac{\pi(-1)^n}{n}$$

Evaluate the remaining integral:
$$\int_0^{\pi}\frac{\cos(nx)}{n}\,dx = \frac{\sin(nx)}{n^2}\Bigg|_0^{\pi} = \frac{\sin(n\pi)}{n^2} = 0$$

Therefore:

$$b_n = \frac{2}{\pi}\left(-\frac{\pi(-1)^n}{n}\right) = \frac{-2(-1)^n}{n} = \frac{2(-1)^{n+1}}{n}$$

---

## Step 3 — Write the Fourier Series

$$\boxed{f(x) = x = 2\sum_{n=1}^{\infty} \frac{(-1)^{n+1}}{n}\sin(nx) = 2\left(\sin x - \frac{\sin 2x}{2} + \frac{\sin 3x}{3} - \frac{\sin 4x}{4} + \cdots\right)}$$

---

## Step 4 — Convergence at Discontinuities

The function $f(x)=x$ is continuous on $(-\pi,\pi)$ but has a **jump discontinuity** at $x = \pm\pi$ when the periodic extension is considered (value jumps from $\pi$ to $-\pi$).

At $x = \pi$, the Dirichlet theorem gives:
$$S(\pi) = \frac{f(\pi^-) + f(\pi^+)}{2} = \frac{\pi + (-\pi)}{2} = 0$$

As a check: $\sin(n\pi) = 0$ for all $n$, so the series evaluates to $0$ at $x=\pi$. Consistent.

---

## Bonus — Classic Series from Parseval's Theorem

Apply Parseval's theorem with $L = \pi$:

$$\frac{1}{\pi}\int_{-\pi}^{\pi} x^2\,dx = \sum_{n=1}^{\infty} b_n^2 = \sum_{n=1}^{\infty}\frac{4}{n^2}$$

$$\frac{1}{\pi}\cdot\frac{2\pi^3}{3} = 4\sum_{n=1}^{\infty}\frac{1}{n^2} \implies \frac{\pi^2}{3} = 4\sum_{n=1}^{\infty}\frac{1}{n^2} \implies \sum_{n=1}^{\infty}\frac{1}{n^2} = \frac{\pi^2}{6}$$

This is the famous Basel problem — a standard GATE follow-up.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"f(x) = x on (−π, π). Before computing any integral, which Fourier coefficients are zero and why?","hint":"Check the symmetry of f(x) = x. Is it even, odd, or neither? Recall that for an odd function on a symmetric interval, the mean is zero and every cosine coefficient vanishes.","answer":"f(x) = x is odd: f(−x) = −x = −f(x). Therefore a₀ = 0 and aₙ = 0 for all n. Only the sine coefficients bₙ are potentially non-zero."},{"prompt":"Compute bₙ using integration by parts and write the full Fourier series.","hint":"Use the half-range formula bₙ = (2/π)∫₀^π x sin(nx) dx. Let u = x, dv = sin(nx)dx. After integration by parts the boundary term gives −π(−1)ⁿ/n and the remaining integral is zero.","answer":"bₙ = 2(−1)^{n+1}/n. The series is f(x) = 2∑(n=1 to ∞) (−1)^{n+1}/n · sin(nx) = 2(sin x − sin(2x)/2 + sin(3x)/3 − …)."}]}
```
