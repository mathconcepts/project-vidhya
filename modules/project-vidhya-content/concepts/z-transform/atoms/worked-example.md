---
id: z-transform.worked-example
concept_id: z-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Z-Transform — Worked Example

## Problem (GATE style)

Find the Z-transform of $x[n] = a^n\,u[n]$ and determine its Region of Convergence (ROC). Then verify by finding the inverse Z-transform of $X(z) = \dfrac{1}{1-0.5z^{-1}}$ for $|z| > 0.5$.

---

## Part A — Forward Z-Transform

### Definition

$$X(z) = \mathcal{Z}\{x[n]\} = \sum_{n=-\infty}^{\infty} x[n]\,z^{-n}$$

### Apply to $x[n] = a^n u[n]$

The unit step $u[n] = 1$ for $n \geq 0$ and $0$ for $n < 0$, so the sum runs from $n=0$:

$$X(z) = \sum_{n=0}^{\infty} a^n\,z^{-n} = \sum_{n=0}^{\infty} \left(\frac{a}{z}\right)^n$$

This is a **geometric series** with ratio $r = \dfrac{a}{z}$.

**Convergence condition:** $|r| < 1 \implies \left|\dfrac{a}{z}\right| < 1 \implies |z| > |a|$

**Sum of geometric series** $\displaystyle\sum_{n=0}^{\infty} r^n = \dfrac{1}{1-r}$ for $|r|<1$:

$$X(z) = \frac{1}{1 - a/z} = \frac{z}{z-a}$$

### Result

$$\boxed{\mathcal{Z}\{a^n u[n]\} = \frac{z}{z-a} = \frac{1}{1-az^{-1}}, \quad \text{ROC: } |z| > |a|}$$

The ROC is the **exterior** of a circle of radius $|a|$ in the $z$-plane, centred at the origin.

---

## Part B — Inverse Z-Transform via Partial Fractions

### Problem

Find $\mathcal{Z}^{-1}\!\left\{\dfrac{1}{1-0.5z^{-1}}\right\}$ given ROC: $|z|>0.5$.

### Match to the Known Pair

Rewrite in terms of $z$ (multiply numerator and denominator by $z$):

$$X(z) = \frac{1}{1-0.5z^{-1}} = \frac{z}{z-0.5}$$

From Part A with $a = 0.5$:

$$\frac{z}{z-0.5} \longleftrightarrow a^n u[n]\Big|_{a=0.5} = (0.5)^n u[n]$$

The ROC $|z| > 0.5$ confirms the **right-sided (causal)** sequence.

### Result

$$\boxed{\mathcal{Z}^{-1}\!\left\{\frac{1}{1-0.5z^{-1}}\right\} = \left(\frac{1}{2}\right)^n u[n]}$$

---

## ROC Summary

| Sequence type | ROC shape | Example |
|---|---|---|
| Right-sided $x[n]u[n]$ | $\|z\| > r$ (exterior of circle) | $a^n u[n]$: ROC $\|z\| > \|a\|$ |
| Left-sided $x[n]u[-n-1]$ | $\|z\| < r$ (interior of circle) | $-a^n u[-n-1]$: ROC $\|z\| < \|a\|$ |
| Finite-duration (FIR) | Entire $z$-plane (except $0$ or $\infty$) | Windowed sequences |

**Critical GATE fact:** The Z-transform expression $\dfrac{z}{z-a}$ alone does not uniquely determine the sequence — the ROC specifies whether it is causal or anti-causal.

---

## Pole-Zero Analysis

For $X(z) = \dfrac{z}{z-a}$:
- **Zero** at $z = 0$
- **Pole** at $z = a$

The ROC never contains poles. Since the ROC for a causal sequence is $|z| > |a|$, the pole at $z=a$ lies on the boundary of the ROC. The system (or sequence) is **stable** if and only if the pole lies inside the unit circle: $|a| < 1$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: inverting the z-transform of 1/(1-0.5z⁻¹)","steps":[{"prompt":"Write the Z-transform sum for x[n] = aⁿu[n] and identify it as a geometric series. What is the ratio, and what condition ensures convergence?","hint":"X(z) = ∑_{n=0}^∞ aⁿ z^{−n} = ∑_{n=0}^∞ (a/z)ⁿ. This is a geometric series ∑ rⁿ with r = a/z. The series converges when |r| < 1.","answer":"The ratio is r = a/z. Convergence requires |a/z| < 1, i.e., |z| > |a|. Summing: X(z) = 1/(1 − a/z) = z/(z − a). The ROC is the region outside the circle of radius |a|."},{"prompt":"Given X(z) = 1/(1 − 0.5z⁻¹) with ROC |z| > 0.5, identify the inverse Z-transform without computing an integral.","hint":"Rewrite as z/(z − 0.5). Compare with the standard pair z/(z − a) ↔ aⁿu[n]. The ROC being the exterior confirms a causal (right-sided) sequence.","answer":"With a = 0.5, the inverse Z-transform is x[n] = (0.5)ⁿ u[n] = (1/2)ⁿ u[n]."}]}
```
