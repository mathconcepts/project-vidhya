# Derivative

## Intuition

The derivative of a function measures how fast the function is changing at a point. If $f(x)$ tells you your position at time $x$, then $f'(x)$ tells you your velocity — how much your position changes per tiny change in time.

The derivative is a function of a function. Given any differentiable $f$, its derivative $f'$ (or $\frac{df}{dx}$) is another function, defined at every point where the original function is "smooth enough" to have a well-defined rate of change.

## Formal definition

The derivative of $f$ at a point $a$ is:

$$
f'(a) = \lim_{h \to 0} \frac{f(a+h) - f(a)}{h}
$$

when this limit exists. The expression $\frac{f(a+h) - f(a)}{h}$ is the slope of the secant line between $(a, f(a))$ and $(a+h, f(a+h))$; the limit as $h \to 0$ is the slope of the tangent line at $a$.

A function is **differentiable** at $a$ if this limit exists. It is **differentiable on an interval** if it is differentiable at every point in the interval.

## Core rules

For common functions, the limit above has been computed once and gives us rules:

| Function | Derivative |
|---|---|
| $c$ (constant) | $0$ |
| $x^n$ | $n \cdot x^{n-1}$ |
| $\sin x$ | $\cos x$ |
| $\cos x$ | $-\sin x$ |
| $e^x$ | $e^x$ |
| $\ln x$ | $\frac{1}{x}$ |

And combinations:

- **Sum rule**: $(f + g)' = f' + g'$
- **Product rule**: $(fg)' = f'g + fg'$
- **Quotient rule**: $\left(\frac{f}{g}\right)' = \frac{f'g - fg'}{g^2}$
- **Chain rule**: $(f(g(x)))' = f'(g(x)) \cdot g'(x)$

## Why this matters for your exam

**BITSAT**: Expect 3-4 questions on derivatives. Most are direct application of the rules above — recognizing which rule applies and executing cleanly under time pressure. The -1 negative marking makes "skip if unsure" a valid strategy.

**JEE Main**: Expect 4-5 questions combining derivative rules with other topics (finding extrema, related rates, differential equations). NAT questions (numerical answer, no negative marking) often test chain rule composition.

**UGEE**: Fewer direct-derivative questions, but the ones that appear tend to be conceptual — "for which values of $x$ is $f$ differentiable" rather than "compute $f'$". Discrete-math tilt means piecewise and limit-based questions appear.

## Common mistakes

1. **Forgetting the chain rule on composites.** If $y = (\sin x)^3$, then $y' = 3(\sin x)^2 \cdot \cos x$, not $3(\sin x)^2$.
2. **Product rule vs chain rule confusion.** $\sin(x) \cos(x)$ needs the product rule; $\sin(\cos(x))$ needs the chain rule.
3. **Sign errors on $-\sin$.** The derivative of $\cos x$ is $-\sin x$ — students drop the minus sign under time pressure.
4. **Treating $e^x$ like a power function.** $\frac{d}{dx}e^x = e^x$, not $x \cdot e^{x-1}$.

See [`worked-example.md`](./worked-example.md) for a step-by-step problem.
