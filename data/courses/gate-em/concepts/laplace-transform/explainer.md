# Laplace Transform

> GATE Engineering Mathematics | Transform Theory | high frequency | difficulty: 0.5

## Intuition First

Imagine a time-domain signal that oscillates and decays—like a struck guitar string gradually going silent. The Laplace transform *freezes* this time-dependent behavior into a frequency-domain snapshot, where exponential decay becomes a simple pole, and oscillations become peaks. It trades time for complex frequency.

## Core Definition

**The Laplace Transform**: For a time-domain function $f(t)$ defined for $t \geq 0$, the Laplace transform is:

$$\mathcal{L}\{f(t)\} = F(s) = \int_0^\infty e^{-st} f(t) \, dt$$

where $s = \sigma + j\omega$ is the complex frequency variable. The integral converges for $\text{Re}(s) > \sigma_c$ (the region of convergence).

**Geometric interpretation**: Each factor $e^{-st}$ in the integrand is a rotating exponential decay in the complex plane. The real part $\sigma$ controls decay rate; the imaginary part $\omega$ controls rotation. As $s$ varies, different decay–rotation pairs are weighted by $f(t)$.

## What Happens (Worked Example)

**Example**: Find the Laplace transform of $f(t) = e^{-2t}$ for $t \geq 0$.

**What happens:**

$$F(s) = \int_0^\infty e^{-st} \cdot e^{-2t} \, dt = \int_0^\infty e^{-(s+2)t} \, dt$$

Let $u = -(s+2)t$. Then:

$$F(s) = \left[ \frac{e^{-(s+2)t}}{-(s+2)} \right]_0^\infty$$

For convergence (Re$(s) > -2$), the exponential vanishes as $t \to \infty$:

$$F(s) = \frac{1}{s+2}, \quad \text{Re}(s) > -2$$

**Why it works:**

The key is recognizing that $e^{-(s+2)t} \to 0$ exponentially as $t \to \infty$ whenever $\text{Re}(s+2) > 0$. This is the *decay condition*—the complex frequency $s$ must lie to the right of the pole at $s = -2$ in the complex plane. The transform converts time-exponential decay (factor $e^{-2t}$) into a simple rational pole, which is easier to manipulate in the $s$-domain.

## GATE MA Relevance

> **Why it matters in GATE MA:** Laplace transforms appear in 6–8% of GATE papers (15–25 marks/year), typically as MCQ inverse-transform identification, NAT pole-location finding, or multi-step system-response problems. Mastery unlocks differential-equation solving (ODEs) and control-theory analysis.
