# Differentiability

> GATE Engineering Mathematics | Calculus | medium frequency | difficulty: 0.4

## Intuition First

A function is differentiable if it has a smooth, well-defined tangent line at each point — no sharp corners or cusps. Differentiability is a stronger condition than continuity.

## Core Definition

**Differentiability at a Point**: A function $f$ is differentiable at $x = a$ if the derivative $f'(a)$ exists, defined as:
$$f'(a) = \lim_{h \to 0} \frac{f(a+h) - f(a)}{h}$$

This limit, if it exists and is finite, gives the slope of the tangent line to the curve at $x = a$.

**Relationship to Continuity**: If $f$ is differentiable at $a$, then $f$ is continuous at $a$. Converse is false: continuity does not imply differentiability (e.g., $|x|$ is continuous but not differentiable at $x = 0$).

**Differentiability on an Interval**: $f$ is differentiable on $(a,b)$ if it is differentiable at every point in the interval. $f$ is differentiable on $[a,b]$ if it is differentiable on $(a,b)$ and the one-sided derivatives at the endpoints exist.

## What Happens (Worked Example)

**Example: $f(x) = |x|$ is continuous but NOT differentiable at $x = 0$**

**Continuity at $x = 0$:**
$$\lim_{x \to 0} |x| = 0 = f(0) \quad \checkmark$$

**Differentiability at $x = 0$:** Check the derivative definition:
$$f'(0) = \lim_{h \to 0} \frac{|0+h| - |0|}{h} = \lim_{h \to 0} \frac{|h|}{h}$$

Right-side limit: $\lim_{h \to 0^+} \frac{h}{h} = 1$

Left-side limit: $\lim_{h \to 0^-} \frac{-h}{h} = -1$

**What happens:** The left and right derivatives are different ($-1 \neq 1$). The function has a sharp corner ("cusp") at the origin. The derivative does not exist.

**Why it works:** Differentiability requires the function to be "smooth" — the slope must approach the same value from both sides. The corner creates two different slopes.

## GATE MA Relevance

> **Why it matters in GATE MA:** Differentiability determines where calculus theorems apply. GATE asks: is this function differentiable at a point (MCQ)? Check for corners and cusps. Related to Rolle's Theorem and Mean Value Theorem, which require differentiability on open intervals. Typically 1–2 marks.
