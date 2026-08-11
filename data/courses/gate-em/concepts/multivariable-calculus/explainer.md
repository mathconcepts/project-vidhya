# Multivariable Calculus

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.6

## Intuition First

Multivariable calculus extends single-variable calculus to functions of many variables. Instead of a curve, you have a surface. Instead of a slope, you have partial derivatives in different directions.

## Core Definition

**Partial Derivative**: For $f(x, y)$, the partial derivative with respect to $x$ is:
$$\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h, y) - f(x, y)}{h}$$

(Treat $y$ as constant.)

**Gradient**: $\nabla f = (\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y})$ points in the direction of steepest increase.

**Chain Rule for Multivariable**: If $z = f(x, y)$ and $x = x(t)$, $y = y(t)$:
$$\frac{dz}{dt} = \frac{\partial f}{\partial x} \frac{dx}{dt} + \frac{\partial f}{\partial y} \frac{dy}{dt}$$

## What Happens (Worked Example)

**Example**: Find $\frac{\partial f}{\partial x}$ and $\frac{\partial f}{\partial y}$ for $f(x, y) = x^2 y + 3xy^2 - 5$.

**Partial w.r.t. x**: Treat $y$ as constant.
$$\frac{\partial f}{\partial x} = 2xy + 3y^2$$

**Partial w.r.t. y**: Treat $x$ as constant.
$$\frac{\partial f}{\partial y} = x^2 + 6xy$$

**Gradient**: $\nabla f = (2xy + 3y^2, x^2 + 6xy)$

## GATE MA Relevance

> **Why it matters in GATE MA:** Multivariable calculus is essential in vector fields, optimization, and physics. GATE asks: compute partial derivatives (MCQ or NAT), find critical points, or apply the chain rule. Often 1–2 marks.
